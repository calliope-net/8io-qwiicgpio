
//% color=#7F0000 icon="\uf140" block="8-IO Qwiic" weight=08
namespace qwiicgpio
/* 230817 230825
https://en.wikipedia.org/wiki/General-purpose_input/output

https://www.sparkfun.com/products/17047
https://learn.sparkfun.com/tutorials/sparkfun-qwiic-gpio-hookup-guide

https://cdn.sparkfun.com/assets/b/b/f/1/7/TCA9534.pdf

Code anhand der Datenblätter neu programmiert von Lutz Elßner im August 2023
*/ {
    export enum eADDR {
        GPIO_Qwiic = 0x27, GPIO_Qwiic_x26 = 0x26, GPIO_Qwiic_x25 = 0x25, GPIO_Qwiic_x24 = 0x24,
        GPIO_Qwiic_x23 = 0x23, GPIO_Qwiic_x22 = 0x22, GPIO_Qwiic_x21 = 0x21, GPIO_Qwiic_x20 = 0x20
    }

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


    //% group="General-purpose input/output"
    //% block="i2c %pADDR Konfiguration | 7 %pIO7 6 %pIO6 5 %pIO5 4 %pIO4 3 %pIO3 2 %pIO2 1 %pIO1 0 %pIO0" weight=96
    // inlineInputMode=inline
    export function setMode(pADDR: eADDR, pIO7: eIO, pIO6: eIO, pIO5: eIO, pIO4: eIO, pIO3: eIO, pIO2: eIO, pIO1: eIO, pIO0: eIO) {
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
    //% block="i2c %pADDR lese INPUT_PORT" weight=94
    export function readINPUT_PORT(pADDR: eADDR) {
        return readRegister(pADDR, eCommandByte.INPUT_PORT)
    }


    //% group="General-purpose input/output"
    //% block="i2c %pADDR schreibe OUTPUT_PORT %pByte" weight=90
    export function writeOUTPUT_PORT(pADDR: eADDR, pByte: number) {
        writeRegister(pADDR, eCommandByte.OUTPUT_PORT, pByte)
    }


    // ========== advanced=true
    // ========== GPIO Register


    //% group="GPIO Register" advanced=true
    //% block="i2c %pi2cADDR readRegister %pRegister" weight=62
    export function readRegister(pADDR: eADDR, pRegister: eCommandByte) {
        let bu = pins.createBuffer(1)
        bu.setUint8(0, pRegister)
        pins.i2cWriteBuffer(pADDR, bu, true)

        bu = pins.i2cReadBuffer(pADDR, 1)

        return bu.getUint8(0)
    }

    //% group="GPIO Register" advanced=true
    //% block="i2c %pADDR writeRegister %pRegister %pByte" weight=60
    //% pRegister.defl=qwiicgpio.eCommandByte.OUTPUT_PORT pByte.defl=1
    //% inlineInputMode=inline
    export function writeRegister(pADDR: eADDR, pRegister: eCommandByte, pByte: number) {
        let bu = pins.createBuffer(2)
        bu.setUint8(0, pRegister)
        bu.setUint8(1, pByte)
        pins.i2cWriteBuffer(pADDR, bu)
    }

    // ========== Logik

    export enum eBit { AND, OR, XOR, NOT_AND, LEFT, RIGHT }

    //% group="Logik" advanced=true
    //% block="%a %operator %b" weight=56
    //% b.defl=255
    export function bitwise(a: number, operator: eBit, b: number): number {
        switch (operator) {
            case eBit.AND: { return a & b }
            case eBit.OR: { return a | b }
            case eBit.XOR: { return a ^ b }
            case eBit.NOT_AND: { return (~a) & b }
            case eBit.LEFT: { return a << b }
            case eBit.RIGHT: { return a >> b }
            default: { return a }
        }

        /* if (operator == eBit.AND) { return a & b }
        else if (operator == eBit.OR) { return a | b }
        else if (operator == eBit.XOR) { return a ^ b }
        else if (operator == eBit.NOT_AND) { return (~a) & b }
        else if (operator == eBit.LEFT) { return a << b }
        else if (operator == eBit.RIGHT) { return a >> b }
        else { return a } */
    }

    //% group="Logik" advanced=true
    //% block="NOT %pNumber" weight=54
    export function not(pNumber: number) {
        return ~pNumber
    }

    // ========== 7-Segment Anzeige an Port (7-0) (.GFEDCBA)

    //% group="7-Segment Anzeige an Port (7-0) (.GFEDCBA)" advanced=true
    //% block="wandle %pZiffer um in 7-Segment; Punkt %pPunkt" weight=72
    export function siebenSegment(pZiffer: number, pPunkt: boolean) {
        let dp: number = (pPunkt ? 0b10000000 : 0b00000000) // dezimalpunkt
        switch (pZiffer) { //  GFEDCBA
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
            default: { return pZiffer }
        }
    }

} // 8io-qwiicgpio.ts
