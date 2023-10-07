
//% color=#7F0000 icon="\uf140" block="8-GPIO" weight=08
namespace qwiicgpio
/* 230817 230825 230930
https://en.wikipedia.org/wiki/General-purpose_input/output

https://www.sparkfun.com/products/17047
https://learn.sparkfun.com/tutorials/sparkfun-qwiic-gpio-hookup-guide

https://cdn.sparkfun.com/assets/b/b/f/1/7/TCA9534.pdf

Code anhand der Datenblätter neu programmiert von Lutz Elßner im August 2023
*/ {
    export enum eADDR {
        GPIO_x27 = 0x27, GPIO_x26 = 0x26, GPIO_x25 = 0x25, GPIO_x24 = 0x24,
        GPIO_x23 = 0x23, GPIO_x22 = 0x22, GPIO_x21 = 0x21, GPIO_x20 = 0x20
    }
    let n_i2cCheck: boolean = false // i2c-Check
    let n_i2cError: number = 0 // Fehlercode vom letzten WriteBuffer (0 ist kein Fehler)

    export enum eCommandByte { INPUT_PORT = 0x00, OUTPUT_PORT = 0x01, INVERSION = 0x02, CONFIGURATION = 0x03 }

    const INVERT = 0b10         // Register 2: 1=inverted
    //const NO_INVERT = false     // Register 2: 0=original polarity
    //const GPIO_OUT = false      // Register 3: 0=output
    const GPIO_IN = 0b01        // Register 3: 1=input

    //let _gpioInStatus: number           // Register 0
    //let _gpioOutStatus: number = 0xFF   // Register 1
    //let _inversionStatus: number = 0    // Register 2 0=original polarity 1=inverted
    //let _gpioPinMode: number = 0xFF     // Register 3 1=input 0=output

    export enum eIO { IN = 0b01, IN_inverted = 0b11, OUT = 0b00 }

    //% group="beim Start"
    //% block="i2c %pADDR i2c-Check %ck" weight=4
    //% pADDR.shadow="qwiicgpio_eADDR"
    //% ck.shadow="toggleOnOff" ck.defl=1
    export function beimStart(pADDR: number, ck: boolean) {
        n_i2cCheck = (ck ? true : false) // optionaler boolean Parameter kann undefined sein
        n_i2cError = 0 // Reset Fehlercode
    }

    //% group="beim Start"
    //% block="i2c %pADDR Konfiguration | 7 %pIO7 6 %pIO6 5 %pIO5 4 %pIO4 3 %pIO3 2 %pIO2 1 %pIO1 0 %pIO0" weight=2
    //% pADDR.shadow="qwiicgpio_eADDR"
    // inlineInputMode=inline
    export function setMode(pADDR: number, pIO7: eIO, pIO6: eIO, pIO5: eIO, pIO4: eIO, pIO3: eIO, pIO2: eIO, pIO1: eIO, pIO0: eIO) {
        let r3 = 0b00000000 // CONFIGURATION 0=output 1=input
        let r2 = 0b00000000 // INVERSION 0=original polarity 1=inverted
        if ((pIO7 & GPIO_IN) == GPIO_IN) { r3 |= 2 ** 7; if ((pIO7 & INVERT) == INVERT) { r2 |= 2 ** 7 } }
        if ((pIO6 & GPIO_IN) == GPIO_IN) { r3 |= 2 ** 6; if ((pIO6 & INVERT) == INVERT) { r2 |= 2 ** 6 } }
        if ((pIO5 & GPIO_IN) == GPIO_IN) { r3 |= 2 ** 5; if ((pIO5 & INVERT) == INVERT) { r2 |= 2 ** 5 } }
        if ((pIO4 & GPIO_IN) == GPIO_IN) { r3 |= 2 ** 4; if ((pIO4 & INVERT) == INVERT) { r2 |= 2 ** 4 } }
        if ((pIO3 & GPIO_IN) == GPIO_IN) { r3 |= 2 ** 3; if ((pIO3 & INVERT) == INVERT) { r2 |= 2 ** 3 } }
        if ((pIO2 & GPIO_IN) == GPIO_IN) { r3 |= 2 ** 2; if ((pIO2 & INVERT) == INVERT) { r2 |= 2 ** 2 } }
        if ((pIO1 & GPIO_IN) == GPIO_IN) { r3 |= 2 ** 1; if ((pIO1 & INVERT) == INVERT) { r2 |= 2 ** 1 } }
        if ((pIO0 & GPIO_IN) == GPIO_IN) { r3 |= 2 ** 0; if ((pIO0 & INVERT) == INVERT) { r2 |= 2 ** 0 } }
        //return r2
        writeRegister(pADDR, eCommandByte.CONFIGURATION, r3)
        writeRegister(pADDR, eCommandByte.INVERSION, r2)
    }

    //% group="General-purpose input/output"
    //% block="i2c %pADDR lese INPUT_PORT" weight=2
    //% pADDR.shadow="qwiicgpio_eADDR"
    export function readINPUT_PORT(pADDR: number) {
        return readRegister(pADDR, eCommandByte.INPUT_PORT)
    }


    //% group="General-purpose input/output"
    //% block="i2c %pADDR schreibe OUTPUT_PORT %byte" weight=1
    //% pADDR.shadow="qwiicgpio_eADDR"
    //% byte.min=0 byte.max=255 byte.defl=1
    export function writeOUTPUT_PORT(pADDR: number, byte: number) {
        writeRegister(pADDR, eCommandByte.OUTPUT_PORT, byte)
    }


    // ========== advanced=true
    // ========== group="GPIO Register"

    //% group="GPIO Register" advanced=true
    //% block="i2c %pADDR readRegister %pRegister" weight=2
    //% pADDR.shadow="qwiicgpio_eADDR"
    export function readRegister(pADDR: number, pRegister: eCommandByte) {
        let bu = Buffer.create(1)
        bu.setUint8(0, pRegister)
        i2cWriteBuffer(pADDR, bu, true)
        bu = i2cReadBuffer(pADDR, 1)
        return bu.getUint8(0)
    }

    //% group="GPIO Register" advanced=true
    //% block="i2c %pADDR writeRegister %pRegister %byte" weight=1
    //% pADDR.shadow="qwiicgpio_eADDR"
    //% pRegister.defl=qwiicgpio.eCommandByte.OUTPUT_PORT
    //% byte.min=0 byte.max=255 byte.defl=1
    //% inlineInputMode=inline
    export function writeRegister(pADDR: number, pRegister: eCommandByte, byte: number) {
        let bu = Buffer.create(2)
        bu.setUint8(0, pRegister)
        bu.setUint8(1, byte)
        i2cWriteBuffer(pADDR, bu)
    }


    // ========== group="Logik"

    export enum eBit {
        //% block="a & b AND"
        AND,
        //% block="a | b OR"
        OR,
        //% block="a ^ b XOR"
        XOR,
        //% block="(~a) & b (NOT a) AND b"
        NOT_AND,
        //% block="a << b"
        LEFT,
        //% block="a >> b"
        RIGHT,
        //% block="a >>> b"
        RIGHTZ
    }

    //% group="Logik" advanced=true
    //% block="Bitweise %a %operator %b" weight=6
    //% b.min=0 b.max=255 b.defl=255
    export function bitwise(a: number, operator: eBit, b: number): number {
        switch (operator) {
            case eBit.AND: { return a & b }
            case eBit.OR: { return a | b }
            case eBit.XOR: { return a ^ b }
            case eBit.NOT_AND: { return (~a) & b }
            case eBit.LEFT: { return a << b }
            case eBit.RIGHT: { return a >> b }
            case eBit.RIGHTZ: { return a >>> b }
            default: { return a }
        }
    }

    //% group="Logik" advanced=true
    //% block="Bitweise NOT %a" weight=4
    export function not(a: number) { return ~a }

    export enum eRadix { DEZ = 10, HEX = 16, BIN = 2 }

    //% group="Logik" advanced=true
    //% block="parseInt %text || radix %radix" weight=2
    //% radix.defl=10
    export function parseint(text: string, radix?: eRadix) {
        if (radix == 10 && text.length >= 3 && text.substr(0, 2).toLowerCase() == "0b")
            return parseInt(text.substr(2), 2) // 0b -> BIN
        else if (radix == 10)
            return parseInt(text) // 0x.. -> HEX sonst -> DEZ
        else
            return parseInt(text, radix)
    }



    // ========== 7-Segment Anzeige an Port (7-0) (.GFEDCBA)

    //% group="7-Segment Anzeige an Port (7-0) (.GFEDCBA)" advanced=true
    //% block="wandle %hexZiffer um in 7-Segment; Punkt %pPunkt"
    //% hexZiffer.min=0 hexZiffer.max=15
    //% pPunkt.shadow="toggleOnOff"
    export function siebenSegment(hexZiffer: number, pPunkt: boolean) {
        let dp: number = (pPunkt ? 0b10000000 : 0b00000000) // dezimalpunkt
        switch (hexZiffer) { //  GFEDCBA
            case 0: { return 0b0111111 | dp }
            case 1: { return 0b0000110 | dp }
            case 2: { return 0b1011011 | dp }
            case 3: { return 0b1001111 | dp }
            case 4: { return 0b1100110 | dp }
            case 5: { return 0b1101101 | dp }
            case 6: { return 0b1111101 | dp }
            case 7: { return 0b0000111 | dp }
            case 8: { return 0b1111111 | dp }
            case 9: { return 0b1101111 | dp }
            case 10: { return 0b1110111 | dp }
            case 11: { return 0b1111100 | dp }
            case 12: { return 0b0111001 | dp }
            case 13: { return 0b1011110 | dp }
            case 14: { return 0b1111001 | dp }
            case 15: { return 0b1110001 | dp }
            default: { return hexZiffer }
        }
    }


    // ========== group="i2c Adressen"

    //% blockId=qwiicgpio_eADDR
    //% group="i2c Adressen" advanced=true
    //% block="%pADDR" weight=4
    export function qwiicgpio_eADDR(pADDR: eADDR): number { return pADDR }

    //% group="i2c Adressen" advanced=true
    //% block="i2c Fehlercode" weight=2
    export function i2cError() { return n_i2cError }

    function i2cWriteBuffer(pADDR: number, buf: Buffer, repeat: boolean = false) {
        if (n_i2cError == 0) { // vorher kein Fehler
            n_i2cError = pins.i2cWriteBuffer(pADDR, buf, repeat)
            if (n_i2cCheck && n_i2cError != 0)  // vorher kein Fehler, wenn (n_i2cCheck=true): beim 1. Fehler anzeigen
                basic.showString(Buffer.fromArray([pADDR]).toHex()) // zeige fehlerhafte i2c-Adresse als HEX
        } else if (!n_i2cCheck)  // vorher Fehler, aber ignorieren (n_i2cCheck=false): i2c weiter versuchen
            n_i2cError = pins.i2cWriteBuffer(pADDR, buf, repeat)
        //else { } // n_i2cCheck=true und n_i2cError != 0: weitere i2c Aufrufe blockieren
    }

    function i2cReadBuffer(pADDR: number, size: number, repeat: boolean = false): Buffer {
        if (!n_i2cCheck || n_i2cError == 0)
            return pins.i2cReadBuffer(pADDR, size, repeat)
        else
            return Buffer.create(size)
    }

} // qwiicgpio.ts
