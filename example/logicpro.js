const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function getLogicProInfo() {
  const script = `
    osascript -e '
    if application "Logic Pro" is not running then
      return "{\\"projectName\\": \\"Not Available\\", \\"status\\": \\"Not Running\\"}"
    end if
    
    tell application "Logic Pro"
      try
        if not (exists window 1) then
          return "{\\"projectName\\": \\"No Project Open\\", \\"status\\": \\"Idle\\"}"
        end if
        
        set projectTitle to name of window 1
        
        -- Check if project is playing
        set trackStatus to "Editing"
        try
          tell application "System Events"
            tell process "Logic Pro"
              if exists (menu item "Stop" of menu 1 of menu bar item "Transport" of menu bar 1) then
                set trackStatus to "Playing"
              end if
            end tell
          end tell
        end try
        
        return "{\\"projectName\\": \\"" & projectTitle & "\\", \\"status\\": \\"" & trackStatus & "\\"}"
      on error errMsg
        log errMsg
        return "{\\"projectName\\": \\"Error: " & errMsg & "\\", \\"status\\": \\"Error\\"}"
      end try
    end tell'
  `;

  try {
    console.log("Executing Logic Pro info script...");
    const { stdout } = await execPromise(script);
    console.log("Raw script output:", stdout.trim());

    const result = JSON.parse(stdout.trim());
    console.log("Parsed result:", result);

    return result;
  } catch (error) {
    console.error("Error getting Logic Pro info:", error);
    if (error.stderr) {
      console.error("Script error output:", error.stderr);
    }
    return { projectName: "Not Available", status: "Not Running" };
  }
}

module.exports = { getLogicProInfo };
