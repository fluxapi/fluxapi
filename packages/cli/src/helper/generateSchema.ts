import $RefParser from '@apidevtools/json-schema-ref-parser';
import * as ts from 'ts-json-schema-generator';
interface GenerateSchemaOptions {
  removeDateTime: boolean;
}

function addId(schema: { [key: string]: any }) {
  return Object.fromEntries(
    Object.entries(schema).map(([key, value]) => {
      return [key, { ...value, $id: `${key}` }];
    }),
  );
}

export class GenerateGlobalSchema {
  constructor(private base: string, private params: GenerateSchemaOptions) {}

  async getSchema() {
    const config = {
      path: `${this.base}/**/*schema.ts`,
      tsconfig: './tsconfig.json',
    };

    try {
      const schema = ts.createGenerator(config).createSchema();

      const removedReferences = await $RefParser.dereference(schema);
      if (!removedReferences.definitions) {
        throw new Error('definitions are missing');
      }

      const withIds = addId(removedReferences.definitions);

      return JSON.stringify(withIds, null, 2);
    } catch (e: any) {
      if (e.message.includes('NoRootNamesError')) {
        console.warn(
          `\nMissing interfaces for path: ${this.base}/controllers/*/interfaces.ts\n`,
        );
        return '';
      }

      throw e;
    }
  }
  async handle() {
    let schema = await this.getSchema();

    /*
    schema = schema.replace(/, format: 'date-time'/g, '');

    if (schema.includes('date-time')) {
      console.warn(
        `\ndate-time is used in schema. This causes issues with fastify serialization. Use string instead.\n`,
      );
    }*/

    return schema;
  }
}

export async function generateSchema(
  path: string,
  options: GenerateSchemaOptions,
) {
  const instance = new GenerateGlobalSchema(path, options);

  return instance.handle();
}
