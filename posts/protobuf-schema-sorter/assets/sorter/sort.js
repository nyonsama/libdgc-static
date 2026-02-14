import { tokenize } from "./tokenize.js";

/**
 * 给.proto文件里的message等排序
 *
 * @param {string} source
 */
export const sortProtoSchema = (source) => {
  const tn = tokenize(source);

  // 下一个token是引号
  const isQuote = () => {
    const token = tn.peek();
    return token === '"' || token === "'";
  };

  // 跳过一对引号
  const skipString = () => {
    const start = tn.peek();
    if (isQuote()) {
      tn.skip(start); // 引号
      tn.next(); // 字符串内容
      tn.skip(start); // 引号
    } else {
      throw new Error("Not a string");
    }
  };

  // 跳过一对{}括号
  const skipBlock = () => {
    if (tn.peek() === "{") {
      let start = { line: tn.line, offset: tn.offset - 1 };
      tn.next();
      while (true) {
        const token = tn.peek();
        if (token === "}") {
          const end = { line: tn.line, offset: tn.offset };
          tn.next();
          return { start, end };
        } else if (token === "{") {
          skipBlock();
        } else if (isQuote()) {
          skipString();
        } else if (token) {
          tn.next();
        } else {
          return null;
        }
      }
    } else {
      throw new Error("Not a {} block");
    }
  };

  /**
   * 判断下一个token是不是 enum/message/extend/service
   *
   * https://protobuf.dev/reference/protobuf/proto2-spec/#top_level_definitions
   */
  const isTopLevelDefinition = () => {
    return ["enum", "message", "extend", "service"].includes(tn.peek());
  };

  // 搜索下一个 enum/message/extend/service 代码块
  const nextTopLevelDefinition = () => {
    while (true) {
      const token = tn.peek();
      if (token === null) {
        // eof
        return null;
      }

      if (isTopLevelDefinition()) {
        /** @type {'enum' | 'message' | 'extend' | 'service'} */
        const type = tn.next();
        const start = { line: tn.line, offset: tn.offset - type.length };
        const identifier = tn.next();
        const { end } = skipBlock();
        return { identifier, type, start, end };
      } else if (isQuote()) {
        skipString();
      } else {
        tn.next();
      }
    }
  };

  /** @type {Array<NonNullable<ReturnType<typeof nextTopLevelDefinition>>>} */
  const messages = [];
  while (true) {
    const block = nextTopLevelDefinition();
    if (block) {
      messages.push(block);
    } else {
      break;
    }
  }

  // 给 enum/message/extend/service 代码块排序
  const sortedMessages = messages.slice().sort((a, b) => {
    if (a.identifier !== b.identifier) {
      return a.identifier > b.identifier ? 1 : -1;
    } else if (a.type !== b.type) {
      return a.type > b.type ? 1 : -1;
    } else {
      return 0;
    }
  });

  // 把排序后的代码块拼起来
  const result = [];
  {
    let lastEnd = 0;
    for (let index = 0; index < messages.length; index++) {
      const message = messages[index];

      result.push(source.slice(lastEnd, message.start.offset));
      lastEnd = message.end.offset;

      const sortedMessage = sortedMessages[index];
      result.push(
        source.slice(sortedMessage.start.offset, sortedMessage.end.offset),
      );
    }
    if (lastEnd < source.length) {
      result.push(source.slice(lastEnd));
    }
  }
  return result.join("");
};
