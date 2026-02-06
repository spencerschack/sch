import { useState, useEffect } from "react";

export function useFocused(): boolean {
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    // Enable focus reporting
    process.stdout.write("\x1b[?1004h");

    const handler = (data: Buffer) => {
      const str = data.toString();
      if (str.includes("\x1b[I")) setFocused(true);
      if (str.includes("\x1b[O")) setFocused(false);
    };

    process.stdin.on("data", handler);

    return () => {
      // Disable focus reporting
      process.stdout.write("\x1b[?1004l");
      process.stdin.off("data", handler);
    };
  }, []);

  return focused;
}
