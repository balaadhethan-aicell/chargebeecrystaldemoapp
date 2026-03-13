type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, event: string, payload?: Record<string, unknown>) {
  const entry = {
    level,
    event,
    at: new Date().toISOString(),
    ...payload
  };

  const text = JSON.stringify(entry);

  if (level === "error") {
    console.error(text);
    return;
  }

  if (level === "warn") {
    console.warn(text);
    return;
  }

  console.log(text);
}

export const logger = {
  info(event: string, payload?: Record<string, unknown>) {
    write("info", event, payload);
  },
  warn(event: string, payload?: Record<string, unknown>) {
    write("warn", event, payload);
  },
  error(event: string, payload?: Record<string, unknown>) {
    write("error", event, payload);
  }
};
