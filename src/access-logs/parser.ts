import { readFileSync } from 'fs';
import { resolve } from 'path';

const identifierAndValue = /^(\w*)(.*?)$/;
const capture = '(.+?)';

export class Parser {
  private identifiers: string[] = []
  private schema: RegExp
  private link : string;
  private model : string;

  constructor(path: string) {
    this.link = path;
    // TODO Le modèle ne doit pas être mis en dur dans le code
    this.model = '$remote_addr - $remote_user [$time_local] "$request" $status $bytes_sent "$http_referer" "$http_user_agent"';
    const attributes = this.model.split('$');
    const delimiters: string[] = [];

    delimiters.push(attributes.shift() as string);

    for (const attribute of attributes) {
      const token = attribute.match(identifierAndValue) as RegExpMatchArray;
      this.identifiers.push(token[1]);
      const delimiter = Parser.escapeRegExpLiteral(token[2]);
      delimiters.push(delimiter);
    }

    const regexpString = '^' + delimiters.join(capture) + '$';
    this.schema = new RegExp(regexpString);
  }

  public parse() {
    const line = this._readData(this.link);
    const values = line.match(this.schema);

    if (!values || values.length - 1 !== this.identifiers.length) {
      throw new TypeError(`Line does not match the schema. line: "${line}"`);
    }
    values.shift();
    const result: { [key: string]: string } = {};

    for (let i = 0; i < values.length; i++) {
      const identifier = this.identifiers[i];
      result[identifier] = values[i];
    }

    return [result];
  }

  private static escapeRegExpLiteral(str: string): string {
    return str.replace(/[\\.?*+^$|\-(){}\[\]]/g, '\\$&');
  }

  private _readData(path: string): any {

    return readFileSync(resolve(path), 'utf-8');
  }
}