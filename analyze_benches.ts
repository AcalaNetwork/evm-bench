import assert from 'assert';
import fs from 'fs';
import path from 'path';

interface Bench {
    name: string;
    weight: number;
    reads: number;
    writes: number;
};

type Output = Bench & {
    total_weight: number;
    used_gas: number;
    ratio: number;
};

const stdinBuffer = fs.readFileSync(0, 'utf-8'); // STDIN_FILENO = 0
assert(stdinBuffer);

const bench_path = stdinBuffer.toString().split('\n').filter(x => !!x).slice(-1)[0];
assert(bench_path);

const bench_data = fs.readFileSync(bench_path, 'utf-8');
const bench_config = fs.readFileSync(__dirname + '/build/benches.json', 'utf-8');

const benches: Bench[] = JSON.parse(bench_data);
const config = JSON.parse(bench_config);

const db_read = 25_000_000;
const db_write = 100_000_000;

const output: Output [] = benches
    .map(({ name, reads, writes, weight }) => {
        const used_gas = config[name]['used_gas'];
        const total_weight = weight + reads * db_read + writes * db_write;
        const ratio = parseInt((total_weight / used_gas).toString());
        return {
            name,
            reads,
            writes,
            weight,
            total_weight,
            used_gas,
            ratio
        };
    })
    .sort((a, b) => b.ratio - a.ratio);

assert(output.length > 0);

console.table(output);
console.log('Ratio', output[0].ratio);

const file = `// This file is part of Acala.

// Copyright (C) 2020-2021 Acala Foundation.
// SPDX-License-Identifier: GPL-3.0-or-later WITH Classpath-exception-2.0

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

pub static RATIO: u64 = ${output[0].ratio};
`;

const output_path = process.argv.slice(2)[0];
if (output_path) {
    const file_path = path.resolve(__dirname, output_path);
    fs.writeFileSync(file_path, file);
}
