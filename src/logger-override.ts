import ErrorStackParser from "error-stack-parser";
import { DateTime } from "luxon";
import path from "path";

let TRACE_MAX_LENGTH = 0;
const ERROR_TRACE_SIZE = 5;
const TRACE_SEGMENT_SIZE = 3;

const rgbANSI = (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`;

const RESET = "\x1b[0m";
const BRIGHT = "\x1b[1m";

const BLACK = "\x1b[30m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";
const WHITE = "\x1b[37m";

// extra
const ORANGE = rgbANSI(255, 150, 70);
const LIME = rgbANSI(241, 255, 138);
const PURPLE = rgbANSI(184, 148, 255);
const PINK = rgbANSI(242, 99, 255);
const AQUA = rgbANSI(66, 255, 198);
const RGB = rgbANSI;

const bBLACK = "\x1b[40m";
const bRED = "\x1b[41m";
const bGREEN = "\x1b[42m";
const bYELLOW = "\x1b[43m";
const bBLUE = "\x1b[44m";
const bMAGENTA = "\x1b[45m";
const bCYAN = "\x1b[46m";
const bWHITE = "\x1b[47m";

const wrap = (content: string, colorCode: string) => {
  return (colorCode ?? "") + content + RESET;
};

const wlog = (content: string, colorCode: string) => {
  console.log(colorCode + content + RESET);
};

function getColorCodeByLevel(level: string) {
  switch (level) {
    case "DEBUG":
      return MAGENTA;
    case "INFO":
      return CYAN;
    case "WARN":
      return YELLOW;
    case "ERROR":
      return RED;
    case "SYSTEM":
      return BLUE;
    default:
      return RESET;
  }
}

const filenamePrettier = (fullFilename: string) => {
  // should include extension
  const segments = fullFilename.split(".");
  if (segments.length === 1) return fullFilename;
  let filename = "";
  for (let i = 0; i < segments.length - 1; i++) {
    let segment = segments[i];
    if (i > 0) {
      // make camel
      segment = segment[0].toUpperCase() + segment.slice(1);
    }
    filename += segment;
  }
  return filename;
};

const shorten = (value: any, newLineLimit = null) => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";

  const valueType: string = typeof value;
  switch (valueType) {
    case "string":
      return value;
    case "object":
      if (value instanceof Error) {
        const errorStack = value.stack;
        const matched = errorStack?.match(/[.a-zA-Z0-9]+\:[0-9]+/g) ?? null;
        const matchedTraces = matched != null ? matched.slice(0, ERROR_TRACE_SIZE) : [];
        let traceTexts = [];

        for (let trace of matchedTraces) {
          const filenameSegments = trace.split(".");
          const lineSegments = trace.split(":");
          const filename = filenamePrettier(trace);

          const lastSegment = lineSegments[lineSegments.length - 1];
          const lines = lastSegment.match(/([0-9]+)/g);
          const line = lines?.[0] ?? "";
          traceTexts.push(`${filename}(${line})`);
        }

        traceTexts = traceTexts.reverse();
        return wrap(`[Trace: ${traceTexts.length > 0 ? traceTexts.join(".") : "unknown"}]`, RED) + " " + value.message;
      }
  }

  try {
    let stringifiedContent = JSON.stringify(value);
    if (newLineLimit && stringifiedContent.length > newLineLimit) {
      return "\n" + JSON.stringify(value, null, 4);
    }
    return stringifiedContent;
  } catch (err) {
    return "[Circular Object]";
  }
};

const tracer = () => {
  const error = new Error();
  const parsed = ErrorStackParser.parse(error);

  const slicedCallStack = parsed.slice(3, 3 + TRACE_SEGMENT_SIZE);
  let lastSegmentTrace = "";
  let callStackTraceMsg = slicedCallStack
    .reverse()
    .map((entry) => {
      let rawFilename = entry.fileName;
      if (rawFilename == null) return "null";

      const filebase = path.basename(rawFilename);
      let dotSplits = filebase.split(".");
      let filename = dotSplits?.[0] ?? filebase;

      if (filename === lastSegmentTrace) {
        filename = "&";
      } else {
        lastSegmentTrace = filename;
      }
      return `${filename}(${entry.lineNumber ?? "??"})`;
    })
    .join(".");

  TRACE_MAX_LENGTH = Math.max(TRACE_MAX_LENGTH, callStackTraceMsg.length);
  return callStackTraceMsg;
};

const logger = (level: string, ...arg: any[]) => {
  let levelColorCode = getColorCodeByLevel(level);

  let timeSegment = DateTime.now().toFormat("yy/LL/dd HH:mm:ss.SSS");
  let levelSegment = wrap(level.padEnd(6, " "), levelColorCode);
  let traceSegment = wrap(tracer().padEnd(TRACE_MAX_LENGTH, " "), YELLOW);

  let contentSegment = arg.map((argument) => shorten(argument)).join(" ");
  if (level === "ERROR") contentSegment = wrap(contentSegment, RED);

  const finalString = `${timeSegment} ${levelSegment} ${traceSegment} ${contentSegment}`;

  // need within stdout
  console.log(finalString);

  // const colorSanitizedString = finalString.replace(
  //   /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
  //   ""
  // );
};

export default () => {
  console.debug = (...arg) => logger("DEBUG", ...arg);
  console.info = (...arg) => logger("INFO", ...arg);
  console.warn = (...arg) => logger("WARN", ...arg);
  console.error = (...arg) => logger("ERROR", ...arg);
};
