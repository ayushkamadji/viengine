/* eslint-disable */

/* Combo code rules:
 * 1. Printable keys are in lower case
 * 2. Mod keys are in lower case
 * 3. Function keys keep their name as combo code (including case)
 * 4. Unsupported keys are mapped to "unidentified"
 * 5. Unidentified code is mapped to "unidentified"
 *
 * Example combo code:
 * ctrl + alt + shift + a
 * ctrl + Enter
 * u
 * meta + Delete
 *
 * Example of wrong combo code:
 * shift + A // using capital A
 * enter // should be Enter
 */

// prettier-ignore
export const ComboCode = {
  Backquote:      "`",
  Backslash:      "\\",
  BracketLeft:    "[",
  BracketRight:   "]",
  Comma:          ",",
  Digit0:         "0",
  Digit1:         "1",
  Digit2:         "2",
  Digit3:         "3",
  Digit4:         "4",
  Digit5:         "5",
  Digit6:         "6",
  Digit7:         "7",
  Digit8:         "8",
  Digit9:         "9",
  Equal:          "10",
  IntlBackslash:  "\\",
  IntlRo:         "unidentified",
  IntlYen:        "unidentified",
  KeyA:           "a",
  KeyB:           "b",
  KeyC:           "c",
  KeyD:           "d",
  KeyE:           "e",
  KeyF:           "f",
  KeyG:           "g",
  KeyH:           "h",
  KeyI:           "i",
  KeyJ:           "j",
  KeyK:           "k",
  KeyL:           "l",
  KeyM:           "m",
  KeyN:           "n",
  KeyO:           "o",
  KeyP:           "p",
  KeyQ:           "q",
  KeyR:           "r",
  KeyS:           "s",
  KeyT:           "t",
  KeyU:           "u",
  KeyV:           "v",
  KeyW:           "w",
  KeyX:           "x",
  KeyY:           "y",
  KeyZ:           "z",
  Minus:          "-",
  Period:         ".",
  Quote:          "'",
  Semicolon:      ";",
  Slash:          "/",
  AltLeft:        "alt",
  AltRight:       "alt",
  Backspace:      "Backspace",
  CapsLock:       "CapsLock",
  ContextMenu:    "ContextMenu",
  ControlLeft:    "ctrl",
  ControlRight:   "ctrl",
  Enter:          "Enter",
  MetaLeft:       "meta",
  MetaRight:      "meta",
  ShiftLeft:      "shift",
  ShiftRight:     "shift",
  Space:          "Space",
  Tab:            "Tab",
  Convert:        "unidentified",
  KanaMode:       "unidentified",
  NonConvert:     "unidentified",
  Delete:         "Delete",
  End:            "End",
  Help:           "Help",
  Home:           "Home",
  Insert:         "Insert",
  PageDown:       "PageDown",
  PageUp:         "PageUp",
  NumLock:        "NumLock",
  Numpad0:        "0",
  Numpad1:        "1",
  Numpad2:        "2",
  Numpad3:        "3",
  Numpad4:        "4",
  Numpad5:        "5",
  Numpad6:        "6",
  Numpad7:        "7",
  Numpad8:        "8",
  Numpad9:        "9",
  NumpadAdd:      "+",
  NumpadDecimal:  ".",
  NumpadDivide:   "/",
  NumpadEnter:    "Enter",
  NumpadMultiply: "*",
  NumpadSubtract: "-",
  Escape:         "Escape",
  F1:             "F1",
  F2:             "F2",
  F3:             "F3",
  F4:             "F4",
  F5:             "F5",
  F6:             "F6",
  F7:             "F7",
  F8:             "F8",
  F9:             "F9",
  F10:            "F10",
  F11:            "F11",
  F12:            "F12",
  PrintScreen:    "PrintScreen",
  ScrollLock:     "ScrollLock",
  Pause:          "Pause",
  Unidentified:   "unidentified",
}

// prettier-ignore
export const PrintableKeys = {
  "0":true,"1":true,"2":true,"3":true,"4":true,"5":true,"6":true,"7":true,"8":true,"9":true,
  "A":true,"B":true,"C":true,"D":true,"E":true,"F":true,"G":true,"H":true,"I":true,"J":true,"K":true,"L":true,"M":true,"N":true,"O":true,"P":true,"Q":true,"R":true,"S":true,"T":true,"U":true,"V":true,"W":true,"X":true,"Y":true,"Z":true,
  "a":true,"b":true,"c":true,"d":true,"e":true,"f":true,"g":true,"h":true,"i":true,"j":true,"k":true,"l":true,"m":true,"n":true,"o":true,"p":true,"q":true,"r":true,"s":true,"t":true,"u":true,"v":true,"w":true,"x":true,"y":true,"z":true,
  "`":true,"-":true,"=":true,
  "~":true,"!":true,"@":true,"#":true,"$":true,"%":true,"^":true,"&":true,"*":true,"(":true,")":true,"_":true,"+":true,
  "[":true,"]":true,"\\":true,
  "{":true,"}":true,"|":true,
  ";":true,"\'":true,
  ":":true,"\"":true,
  ",":true,".":true,"/":true,
  "<":true,">":true,"?":true,
  " ":true, "\n":true,"\t":true,"\r":true
}

export const FunctionKeyPrintable = {
  Enter: "\n",
  Tab: "\t",
  Space: " ",
}
