import fastify, { FastifyInstance } from 'fastify';
import { createFastifyInstance } from '../fastify';
import { FluxController, FluxPlugin, FluxConfig } from '../types';
import { registerController } from './controllers';

class Flux {
  controllersRegistered = false;

  constructor(private config: FluxConfig) {}

  async plugins(...plugins: FluxPlugin[]) {
    if (this.controllersRegistered) {
      throw new Error('Plugins must be registered before Controllers.');
    }

    await Promise.all(plugins.map((plugin) => plugin(this.config.fastify)));
  }

  controllers(...controllers: FluxController[]) {
    controllers.forEach((controller) =>
      registerController(controller, this.config),
    );
    this.controllersRegistered = true;
  }

  getFastify() {
    return this.config.fastify;
  }
}

export async function flux({
  fastify,
  controllers,
  plugins,
  mapping,
}: {
  fastify?: FastifyInstance;
  controllers?: FluxController[];
  plugins?: FluxPlugin[];
  mapping?: FluxConfig['mapping'];
}) {
  const instance = new Flux({
    fastify: fastify ? fastify : createFastifyInstance(),
    mapping,
  });

  if (plugins) {
    await instance.plugins(...plugins);
  }

  if (controllers) {
    instance.controllers(...controllers);
  }

  return instance.getFastify();
}
