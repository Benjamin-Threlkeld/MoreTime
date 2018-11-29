import { Timedit } from './time-edit.js'

var g = {
  prefix: 'timer'
}
window.g = g

function init () {

  getElements()
  fetchTimers()
  g.timedit = new Timedit(g.timeIn.timeEditElement)
  g.timedit.onReturn = onAddTimer

  listeners()

  loop()
}

function getElements () {
  //inputs and outputs elements
  g.timeIn = {}
  g.timeIn.e = document.getElementById('addTimer')
  g.timeIn.nameE = g.timeIn.e.querySelector('.timer-name')
  g.timeIn.nameIn = g.timeIn.nameE.querySelector('input')
  g.timeIn.newBtn = g.timeIn.e.querySelector('.timer-add')
  g.timeIn.timeEditElement = g.timeIn.e.querySelector('.timer-duration')

  g.timersE = document.getElementById('timers')
  g.timerTemp = g.timersE.querySelector('.timer')
  g.timerTempBounds = g.timerTemp.getBoundingClientRect()

  // remove invisablity cloak
  g.timerTemp.remove()
  g.timerTemp.classList.remove('invis')
}

function listeners () {
  // name click on focus select text
  g.timeIn.nameIn.addEventListener('focus', (e) => {
      setTimeout(()=> {
        g.timeIn.nameIn.select()
      }, 10)
  })
  g.timersE.addEventListener('click', onTimerDown, false)
  g.timeIn.newBtn.addEventListener('click', onAddTimer, false)
}

// returns the timer object of the clicked element
function containingTimer (target) {
  let timerE
  let timer
  let tries = 0

  // get containing timer
  while (tries < 5 && target.parentElement && !target.parentElement.classList.contains(g.prefix)) {
    tries++
    target = target.parentElement
  }
  if (tries < 5 - 1) {
    // found timer element
    timerE = target.parentElement
    let timerid = timerE.dataset.id
    timer = g.timers[~~timerid-1]
    if (timer.id !== ~~timerid) {
      timer = false
    }
    return timer
  }
}

function onTimerDown (e) {
  let route = [
    {name: '-toggle', func: (timer) => {
      timer.toggle()
      timer.eles.toggleText.innerText = timer.ticking ? timer.stopTxt : timer.startTxt
    }},
    {name: '-reset', func: (timer) => {
      timer.reset()
      timer.eles.toggleText.innerText = timer.startTxt
      timer.eles.progress.style.width = '0%'
    }},
    {name: '-remove', func: (timer) => {
      removeTimer(timer)
      timer.element.remove()
    }}
  ]

  let classes = e.target.classList
  let parentClasses = e.target.parentElement.classList
  for (var i = route.length - 1; i > -1; i--) {
    console.log(route[i].name)
    if (classes.contains(g.prefix + route[i].name) || parentClasses.contains(g.prefix + route[i].name)) {
      let timer = containingTimer(e.target)
      if (timer) {
        route[i].func(timer)
      } else {
        console.log('Route failed.')
      }
      break
    }
  }
}

function removeTimer (timer) {
  g.timers[timer.id - 1] = null
  // update saved timers
  storeTimers()
}

function newTimer (duration, name, flash=true) {
  if (!g.timers) g.timers = []
  console.log('start input:', duration)
  let timer = new Timer(~~duration, name)
  g.timers.push(timer)

  timer.startTxt = "Start"
  timer.stopTxt = "Stop"
  timer.element = g.timerTemp.cloneNode(true)

  timer.eles = {
    name: timer.element.querySelector(`.${g.prefix}-name`),
    left: timer.element.querySelector(`.${g.prefix}-left`),
    toggle: timer.element.querySelector(`.${g.prefix}-toggle`),
    reset: timer.element.querySelector(`.${g.prefix}-reset`),
    progress: timer.element.querySelector(`.${g.prefix}-progress`)
  }

  timer.eles = Object.assign(timer.eles, {
    toggleText: timer.eles.toggle.querySelector('span'),
    leftText: timer.eles.left.querySelector('span'),
    nameText: timer.eles.name.querySelector('span')
  })

  populateTimer(timer)
  g.timersE.appendChild(timer.element)
  g.timersE.scrollTop = g.timerTempBounds.height * (g.timers.length - 1)

  if (flash) {
    timer.element.classList.add('new')

    setTimeout(clearnew.bind(timer), 260)
  }
  function clearnew () {
    this.element.classList.remove('new')
  }
  // save timers in localstorage
  storeTimers()
  return timer
}

function populateTimer(timer) {
  timer.element.dataset.id = timer.id
  timer.eles.nameText.innerText = timer.name.charAt(0).toUpperCase() + timer.name.slice(1)
  timer.eles.toggleText.innerText = timer.startTxt
  timer.eles.progress.style.width = 0 + '%'
}

function onAddTimer (e) {
  // get values
  let duration = g.timedit.ms
  let name = g.timeIn.nameIn.value
  g.timeIn.nameIn.value = ''
  let timer = newTimer(duration, name)
  g.timedit.reset()
  g.timedit.update()
}

function storeTimers () {
  let timers = ''
  g.timers.forEach(timer => {
    if (timer) {
      timers += timer // using the toString function in the timer class
    }
  })

  localStorage.setItem('timers', timers)
}

function fetchTimers () {
  let timersStr = localStorage.getItem('timers') || ''
  let timers = timersStr.split(';')
  timers.forEach(timer => {
    if (timer) {
      let props = timer.split(',')
      if (props.length > 1) {
        newTimer(~~props[0], props[1], false)
      }
    }
  })
}

function loop () {
  // update timers
  if (g.timers) {
    let time = Date.now()
    g.timers.forEach(timer => {
      if (timer) {
        timer.tick(time)
        if (!timer.time.start || (!timer.completed && timer.ticking)) {
          let timef = formatMS(timer.time.left)
          if (timer.eles.leftText.innerText !== timef) {
            timer.eles.leftText.innerText = timef
            timer.eles.progress.style.width = 100 - timer.time.percent + '%'
          }
        } else if (timer.completed) {
          // not the best way to prevent unnecessary draw calls but it'll do
          if (timer.eles.toggleText.innerText != timer.startTxt || timer.eles.leftText.innerText != "Completed!") {
            timer.eles.progress.style.width = 100 + '%'
            timer.eles.toggleText.innerText = timer.startTxt
            timer.eles.leftText.innerText = "Completed!"
          }
        }
      }
    })
  }

  requestAnimationFrame(loop)
}

function preZero(num=0, digits=2, pad='0') {
  return pad.repeat(Math.max(digits - ('' + num).length, 0)) + num
}

function formatMS (ms) {
  let time  = ''
  let mils  = ~~(ms %  1000)
  let secs  = ~~(ms /  1000) %  60 // wrap for every 60 seconds
  let mins  = ~~(ms / (1000  *  60)) % 60 // wrap for every 60 minutes
  let hours = ~~(ms / (1000  *  60   * 60)) // no wrap days

  time += hours > 0 ? preZero(hours) + ":" : ''
  time += preZero(mins) + ':'
  time += preZero(secs) + ':'
  time += preZero(mils, 3) + 'ms'
  return time
}

var timerid = 0
class Timer {
  constructor (duration, name) {
    // timer only deal in milliseconds
    this.id = ++timerid
    this.name = name
    this.duration = duration
    this.reset()
  }

  start (now) {
    if (!this.time.start) {
      this.time.start = now // time timer started
    }

    if (this.time.paused) {
      // add The pause delay
      this.time.start += now - this.time.paused
      this.time.paused = 0 // clear delay
    }
  }

  pause (now) {
    this.time.paused = now // time timer paused
  }

  reset () {
    this.time = {}
    this.completed = false
    this.time.left = this.duration
    this.ticking = false
  }

  toggle () {
    this.ticking = !this.ticking // toggle
    let now = Date.now()
    if (this.completed) {
      this.reset()
      this.ticking = true
      this.start(now)
      return this.ticking
    }
    if (this.ticking) {
      this.start(now)
    } else {
      this.pause(now)
    }
    return this.ticking
  }

  tick (time) {
    let now = Date.now()
    if (this.ticking) {
      this.time.left = this.duration - (now - this.time.start)
      if (this.time.paused) this.time.left += (now - this.time.paused)
      this.time.percent = this.time.left / this.duration * 100
      if (this.time.left <= 0) {
        this.time.percent = 100
        this.completed = true
        this.ticking = false
      }
    }
  }

  toString () {
    return this.duration + ',' + this.name + ';'
  }

}

window.addEventListener('load', init)
