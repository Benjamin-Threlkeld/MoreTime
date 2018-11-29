let timeditCount = 0
class Timedit {
  constructor (container, config) {
    this.id = 'timedit' + (++timeditCount)
    this.container = container
    this.keys = {}

    this.config = {}
    if (config) {
      this.config = {
        config: config,
        hms: config.hms,
        numbers: config.numbers
      }
    }

    this.domQueries()
    this.reset()
    this.update()
  }

  domQueries () {
    // add style class
    if (!this.container.classList.contains('timedit')) {
      this.container.classList.add('timedit')
    }
    // create elements and apply attributes
    this.timeOut = document.createElement('label')
    this.timeOut.setAttribute('for', this.id)

    this.timeIn = document.createElement('input')
    this.timeIn.setAttribute('id', this.id)
    this.timeIn.setAttribute('type', 'text')
    this.timeIn.setAttribute('maxlength', '0')
    this.timeIn.setAttribute('pattern', '\\d*')
    this.timeIn.classList.add('timeditinput')
    // add elements to container
    this.container.appendChild(this.timeOut)
    this.container.appendChild(this.timeIn)
    // assign listeners
    this.timeIn.addEventListener('keydown', this.keydown.bind(this))
    this.timeIn.addEventListener('keyup', this.keyup.bind(this))
    this.timeIn.addEventListener('focus', this.focus.bind(this))
    this.timeIn.addEventListener('blur', this.blur.bind(this))
  }

  reset () {
    this.hms     = ['h', 'm', 's']
    this.timeRaw = this.clearRawTime()
    this.editing = false
    this.count   = 0
  }

  clearRawTime (numbers) {
    return Array(numbers || this.config.numbers || 6).fill(0)
  }

  focus (e) {
    if (this.editing) return
    this.count = 0
    this.editing = true
    this.update()
  }

  blur (e) {
    this.editing = false
    //get count
    let a = 0
    for (let i = 0; i < this.timeRaw.length; i++) {
      if (this.timeRaw[i] > 0) {
        a = this.timeRaw.length - i
        break
      }
    }
    this.count = a
    this.act = Date.now()
    this.update()
  }


  keydown (e) {
    if (!this.editing) return
    // specials
    // console.log(e.key)
    if (e.key === 'Meta' || e.key === 'Alt' || e.key === 'Control') {
      this.keys[e.key.toLowerCase()] = Date.now()
    }

    if (isFinite(e.key)) {
      // if just focused and a key is pressed clear the old time
      if (this.count === 0 && Date.now() - this.act > 50) {
        this.timeRaw = this.clearRawTime()
      }

      this.count++
      this.count = this.count > 6 ? 6 : this.count //limit

      this.timeRaw.push(~~e.key) // add to end of array
      this.timeRaw.shift() // remove first

    } else if (e.key === 'Backspace') {
      if (this.keys.meta || this.keys.alt || this.keys.control) {
        this.timeRaw = this.clearRawTime()
        this.count = 0
      } else {
        this.backspace()
      }
    } else if (e.key === 'Enter') {
      this.timeIn.blur()
      if (this.onReturn) this.onReturn()
    }

    this.update()
  }

  keyup (e) {
    if (e.key === 'Meta' || e.key === 'Alt' || e.key === 'Control') {
      this.keys[e.key.toLowerCase()] = false
    }
  }

  backspace () {
    this.count--
    this.count = this.count < 0 ? 0 : this.count //limit
    // shift the array adding zero
    this.timeRaw.unshift(0)
    this.timeRaw.pop()
  }

  formatHtml () {
    let html = ''
    let over = 0
    let num = 0

    this.hms.forEach((t, i) => {
      i *= 2
      // "one" and "two" for each digit of each time segments. "x" for the label
      let one = ''
      let two = ''
      let x = ''

      // if cursor is on the right of this digit
      if (over < this.timeRaw.length - this.count) {
        over++
        one = 'unknown'
      }
      if (over < this.timeRaw.length - this.count) {
        over++
        two = 'unknown'
      }

      // if a number that isnt 0 is entered
      if (this.timeRaw[i] !== 0 || this.timeRaw[i+1] !== 0) num = 1
      // if a number hasnt been entered or the count is practically 0
      if (num === 0 || this.count < 1) x = 'unknown'

      html += `<span><span class="${one}">${this.timeRaw[i]}</span><span class="${two}">${this.timeRaw[i+1]}</span></span><small class="${x}">${t}</small> `
    })
    return html
  }

  formatString () {
    return ''
  }

  timeRawToMS (time) {
    // this will need moded for (days || years) if anyone would want that
    return ((time[0] * 10 + time[1]) * 60 * 60 * 1000) + // hours
           ((time[2] * 10 + time[3]) * 60 * 1000) + // minutes
           ((time[4] * 10 + time[5]) * 1000) // seconds
  }

  update() {
    this.time = this.formatString()
    this.ms = this.timeRawToMS(this.timeRaw)
    this.timeOut.innerHTML = this.formatHtml()
  }

}

export { Timedit }
