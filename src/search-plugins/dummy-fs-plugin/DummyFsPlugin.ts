import { SearchPlugin } from '../interfaces';
import * as fs from 'fs';
import { ScrapedRecord } from '../../types';

export class DummyFsPlugin implements SearchPlugin {
  private records: ScrapedRecord[];
  private outputFileName: string;

  constructor(outputFileName?: string) {
    this.records = [];
    this.outputFileName = outputFileName || 'dummy-fs-records.json';
  }

  async addRecords(newRecords: ScrapedRecord[]) {
    newRecords.forEach((r) => this.records.push(r));
  }

  async finish() {
    fs.writeFileSync(
      this.outputFileName,
      JSON.stringify(
        this.records.sort((a, b) => (a.uniqueId < b.uniqueId ? 1 : -1)),
        undefined,
        4
      )
    );
  }
}
