import { Context } from "./application"
import { Logger } from "./logger"

class BaseComponentContext implements Context {
  registerCommand(_) {
    throw new Error("Method not implemented.")
  }
}

export class BaseComponent {
  context = new BaseComponentContext()

  constructor(private readonly logger: Logger) {}

  render = () => {
    this.logger.info("BaseComponent: Render")
  }
}

export class BaseComponentFactory {
  create(logger: Logger) {
    logger.info("BaseComponentFactory: Create")
    return new BaseComponent(logger)
  }
}
