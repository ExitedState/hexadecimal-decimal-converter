const serialInput = document.getElementById("serialInput");
const convertButton = document.getElementById("convertButton");
const clearButton = document.getElementById("clearButton");

const results = document.getElementById("results");
const errorMessage = document.getElementById("errorMessage");

const colonHexOutput = document.getElementById("colonHexOutput");
const hexOutput = document.getElementById("hexOutput");
const decimalOutput = document.getElementById("decimalOutput");


function colonSeparatedHex(hex) {
  // Add a leading zero when the number of hex digits is odd.
  const padded = hex.length % 2 === 0 ? hex : `0${hex}`;

  return padded
    .match(/.{1,2}/g)
    .join(":")
    .toUpperCase();
}


function parseSerialNumber(input) {
  const value = input.trim();

  if (!value) {
    throw new Error("Please enter a certificate serial number.");
  }

  /*
   * Explicit 0x prefix:
   *
   *   0x33ABD4C6
   */
  if (/^0x/i.test(value)) {
    const hex = value
      .slice(2)
      .replace(/[:\s-]/g, "");

    if (!hex || !/^[0-9a-f]+$/i.test(hex)) {
      throw new Error("Invalid hexadecimal serial number.");
    }

    return BigInt(`0x${hex}`);
  }

  /*
   * Input containing A-F or separators is interpreted as hexadecimal.
   *
   * Examples:
   *
   *   33:AB:D4:C6
   *   33-AB-D4-C6
   *   33 AB D4 C6
   *   33ABD4C6
   */
  const looksLikeHex =
    /[a-f]/i.test(value) ||
    /[:\s-]/.test(value);

  if (looksLikeHex) {
    const hex = value.replace(/[:\s-]/g, "");

    if (!hex || !/^[0-9a-f]+$/i.test(hex)) {
      throw new Error("Invalid hexadecimal serial number.");
    }

    return BigInt(`0x${hex}`);
  }

  /*
   * Digits only are interpreted as decimal.
   *
   * Example:
   *
   *   68682826109936399038699259316908937973
   */
  if (/^\d+$/.test(value)) {
    return BigInt(value);
  }

  throw new Error(
    "Unsupported format. Enter a hexadecimal or decimal serial number."
  );
}


function convertSerialNumber() {
  errorMessage.textContent = "";

  try {
    const number = parseSerialNumber(serialInput.value);

    if (number < 0n) {
      throw new Error("Serial number must be non-negative.");
    }

    const hex = number
      .toString(16)
      .toUpperCase();

    colonHexOutput.textContent = colonSeparatedHex(hex);
    hexOutput.textContent = `0x${hex}`;
    decimalOutput.textContent = number.toString(10);

    results.classList.remove("hidden");
  } catch (error) {
    results.classList.add("hidden");
    errorMessage.textContent = error.message;
  }
}


function clearConverter() {
  serialInput.value = "";

  colonHexOutput.textContent = "";
  hexOutput.textContent = "";
  decimalOutput.textContent = "";

  errorMessage.textContent = "";
  results.classList.add("hidden");

  serialInput.focus();
}


async function copyOutput(button) {
  const targetId = button.dataset.copyTarget;
  const target = document.getElementById(targetId);

  if (!target || !target.textContent) {
    return;
  }

  const originalText = button.textContent;

  try {
    await navigator.clipboard.writeText(target.textContent);

    button.textContent = "Copied!";

    setTimeout(() => {
      button.textContent = originalText;
    }, 1200);
  } catch {
    button.textContent = "Copy failed";

    setTimeout(() => {
      button.textContent = originalText;
    }, 1200);
  }
}


convertButton.addEventListener("click", convertSerialNumber);
clearButton.addEventListener("click", clearConverter);


serialInput.addEventListener("keydown", (event) => {
  /*
   * Ctrl + Enter / Cmd + Enter
   * performs conversion.
   */
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    convertSerialNumber();
  }
});


document.querySelectorAll(".copy-button").forEach((button) => {
  button.addEventListener("click", () => copyOutput(button));
});
