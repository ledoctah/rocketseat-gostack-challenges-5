import fs from 'fs';
import path from 'path';
import csvParse from 'csv-parse';

import uploadConfig from '../config/upload';

export default async function readCSV(
  filename: string,
): Promise<Array<string[]>> {
  const filePath = path.join(uploadConfig.directory, filename);

  const readStream = fs.createReadStream(filePath);

  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });

  const parseCSV = readStream.pipe(parseStream);

  const rows: Array<string[]> = [];

  parseCSV.on('data', row => {
    rows.push(row);
  });

  await new Promise(resolve => {
    parseCSV.on('end', resolve);
  });

  return rows;
}
