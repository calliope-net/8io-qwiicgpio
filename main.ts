input.onButtonEvent(Button.A, input.buttonEventClick(), function () {
    z += -1
    basic.showNumber(z)
    qwiicgpio.writeOUTPUT_PORT(qwiicgpio.eADDR.GPIO_Qwiic, qwiicgpio.not(qwiicgpio.siebenSegment(z, false)))
})
input.onButtonEvent(Button.B, input.buttonEventClick(), function () {
    z += 1
    basic.showNumber(z)
    qwiicgpio.writeOUTPUT_PORT(qwiicgpio.eADDR.GPIO_Qwiic, qwiicgpio.not(qwiicgpio.siebenSegment(z, false)))
})
let z = 0
qwiicgpio.setMode(
qwiicgpio.eADDR.GPIO_Qwiic,
qwiicgpio.eIO.OUT,
qwiicgpio.eIO.OUT,
qwiicgpio.eIO.OUT,
qwiicgpio.eIO.OUT,
qwiicgpio.eIO.OUT,
qwiicgpio.eIO.OUT,
qwiicgpio.eIO.OUT,
qwiicgpio.eIO.OUT
)
