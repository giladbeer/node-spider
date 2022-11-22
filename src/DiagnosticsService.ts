import * as fs from 'fs';
import { getPropertyAtPath, setPropertyAtPath } from './utils';

interface Stat {
  name: string;
  description?: string;
  num?: number;
  patternDescription?: string;
  additionalData?: string;
}

export class DiagnosticsService {
  outputDst: string;
  private static instance?: DiagnosticsService;

  stats: Record<string, Stat>;

  private constructor(outputDst: string) {
    this.outputDst = outputDst;
    this.stats = {};
  }

  static getInstance(outputDst?: string) {
    if (!DiagnosticsService.instance) {
      DiagnosticsService.instance = new DiagnosticsService(
        outputDst || 'node_spider_dump.txt'
      );
    }
    return DiagnosticsService.instance;
  }

  public addStat(stat: Stat) {
    const statPathname = stat.name;
    const path = statPathname.split(' > ');
    setPropertyAtPath(this.stats, path, { ...stat, name: path.at(-1) });
  }

  public updateStat(name: string, data: Partial<Stat>) {
    const statPathname = name;
    const path = statPathname.split(' > ');
    setPropertyAtPath(this.stats, path, {
      ...getPropertyAtPath(this.stats, path),
      ...data
    });
  }

  public incrementStat(name: string, increment?: number) {
    const statPathname = name;
    const path = statPathname.split(' > ');
    setPropertyAtPath(this.stats, path, {
      ...getPropertyAtPath(this.stats, path),
      num:
        ((getPropertyAtPath(this.stats, path) as any)?.num || 0) +
        (increment || 1)
    });
  }

  public writeAllStats() {
    fs.writeFileSync(this.outputDst, JSON.stringify(this.stats, undefined, 4));
  }
}
