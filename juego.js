const TIPOS = ["negra","rubia","dulce","normal"]

const DANO_TIPO = { negra:5, rubia:4, dulce:3, normal:2 }

const PRECIO_TIPO = { negra:3, rubia:3, dulce:2, normal:1 }

const PRECIO_VENTA = { negra:4, rubia:3, dulce:2, normal:1 }

const GASTO_SUMINISTROS = 2
const GASTO_ALQUILER_FALLO = 5
const GASTO_ALQUILER_SIN_MATERIALES = 3

const PROB_EVENTO = 0.50


const $ = s => document.querySelector(s)
function toast(msg){
  const t = $("#toast")
  if(!t) return
  t.textContent = msg
  t.classList.add("show")
  setTimeout(()=>t.classList.remove("show"), 1800)
}

const pantallaPreparacion = $("#pantalla-preparacion")
const textoMonedas = $("#texto-monedas")
const textoReputacion = $("#texto-reputacion")
const textoDoblePrep = $("#texto-doble")
const textoProveedor = $("#texto-proveedor")
const textoAuto = $("#texto-auto")
const botonEmpezar = $("#boton-empezar")
const listaTienda = $("#lista-tienda")
const listaMejoras = $("#lista-mejoras")
const textoInventario = $("#texto-inventario")

const pantallaRonda = $("#pantalla-ronda")
const textoTituloRonda = $("#texto-titulo-ronda")
const textoTiros = $("#texto-tiros")
const textoInventarioRonda = $("#texto-inventario-ronda")
const textoTipoTiroActual = $("#texto-tipo-tiro-actual")
const textoDobleRonda = $("#texto-doble-ronda")
const textoMonedasRonda = $("#texto-monedas-ronda")
const selectorTipoTiro = $("#selector-tipo-tiro")
const botonUsarDoble = $("#boton-usar-doble")
const contenedorClientes = $("#contenedor-clientes")
const botonLanzar = $("#boton-lanzar")
const botonSiguienteRonda = $("#boton-siguiente-ronda")
const textoEstadoRonda = $("#texto-estado-ronda")

const contenedorLog = $("#contenedor-log")
function escribirEnLog(t){ contenedorLog.textContent += t + "\n"; contenedorLog.scrollTop = contenedorLog.scrollHeight }

const modalRecompensa = $("#modal-recompensa")
const contenedorRecompensas = $("#contenedor-recompensas")
const botonCerrarModal = $("#boton-cerrar-modal")

const juego = {
  monedas: 10,
  reputacion: 0,            
  inventario: { negra:0, rubia:0, dulce:0, normal:0 },

  mejorasDanio: { negra:0, rubia:0, dulce:0, normal:0 }, 
  proveedor: false,            
  tiradorAutomatico: false,    
  cargasDobleTiro: 0,

  rondasClientes: [2,4,6,8,10,12],
  rondaActual: 0,

  tirosRestantes: 0,
  tipoSeleccionadoParaTiro: null,
  clienteSeleccionadoId: null,
  usarDobleProximo: false,
  contadorTirosEfectuados: 0,  

  clientes: []
}

function totalCervezas(){
  return TIPOS.reduce((s,t)=>s + juego.inventario[t], 0)
}
function actualizarInventarioPreparacion(){
  const txt = TIPOS.filter(t=>juego.inventario[t]>0).map(t=>`${t}: ${juego.inventario[t]}`).join(", ")
  textoInventario.textContent = txt || "vacío"
}
function actualizarInventarioRonda(){
  const txt = TIPOS.filter(t=>juego.inventario[t]>0).map(t=>`${t}: ${juego.inventario[t]}`).join(", ")
  textoInventarioRonda.textContent = txt || "sin cervezas"
}
function actualizarInventarioTextos(){
  if(textoInventario) actualizarInventarioPreparacion()
  if(textoInventarioRonda) actualizarInventarioRonda()
}
function actualizarBotonEmpezar(){
  botonEmpezar.disabled = (totalCervezas() === 0)
}
function precioCompra(tipo){
  const base = PRECIO_TIPO[tipo]
  return Math.max(1, base - (juego.proveedor ? 1 : 0))
}


function renderTienda(){
  textoMonedas.textContent = juego.monedas
  textoReputacion.textContent = juego.reputacion
  textoDoblePrep.textContent = juego.cargasDobleTiro
  textoProveedor.textContent = juego.proveedor ? "Sí" : "No"
  textoAuto.textContent = juego.tiradorAutomatico ? "Sí" : "No"

  listaTienda.innerHTML = ""
  TIPOS.forEach(tipo=>{
    const item = document.createElement("div")
    item.className = "item"

    const precio = precioCompra(tipo)
    const left = document.createElement("div")
    left.className = "left"
    left.innerHTML = `
      <span class="name">${tipo.toUpperCase()}</span>
      <span class="pill">Compra ${precio}</span>
      <span class="pill">Daño ${DANO_TIPO[tipo] + juego.mejorasDanio[tipo]}</span>
      <span class="pill">Venta ${PRECIO_VENTA[tipo]} + rep</span>
    `
    const right = document.createElement("div")
    const btnMenos = document.createElement("button")
    btnMenos.className = "btn"
    btnMenos.textContent = "−"
    btnMenos.onclick = ()=>{
      if(juego.inventario[tipo] > 0){
        juego.inventario[tipo]--
        juego.monedas += precio
        actualizarInventarioTextos()
        renderTienda()
        actualizarBotonEmpezar()
      }
    }
    const cnt = document.createElement("span")
    cnt.className = "contador"
    cnt.textContent = juego.inventario[tipo]
    const btnMas = document.createElement("button")
    btnMas.className = "btn"
    btnMas.textContent = "+"
    btnMas.onclick = ()=>{
      if(juego.monedas >= precio){
        juego.inventario[tipo]++
        juego.monedas -= precio
        actualizarInventarioTextos()
        renderTienda()
        actualizarBotonEmpezar()
      } else {
        toast("No tienes suficientes monedas")
      }
    }
    right.appendChild(btnMenos); right.appendChild(cnt); right.appendChild(btnMas)

    item.appendChild(left); item.appendChild(right)
    listaTienda.appendChild(item)
  })

  listaMejoras.innerHTML = ""

  TIPOS.forEach(tipo=>{
    const nivel = juego.mejorasDanio[tipo]
    const precioMejora = nivel===0 ? 5 : (nivel===1 ? 8 : null)
    const item = document.createElement("div")
    item.className = "item"
    item.innerHTML = `
      <div class="left">
        <span class="name">Daño ${tipo.toUpperCase()}</span>
        <span class="pill">Nivel: ${nivel}</span>
        ${precioMejora!==null ? `<span class="pill">Coste ${precioMejora}</span>` : `<span class="pill">Máximo</span>`}
      </div>
    `
    const right = document.createElement("div")
    const btn = document.createElement("button")
    btn.className = "btn"
    btn.textContent = "Mejorar"
    btn.disabled = (precioMejora===null || juego.monedas < precioMejora)
    btn.onclick = ()=>{
      if(precioMejora!==null && juego.monedas>=precioMejora){
        juego.monedas -= precioMejora
        juego.mejorasDanio[tipo] = Math.min(2, juego.mejorasDanio[tipo]+1)
        renderTienda()
      }
    }
    right.appendChild(btn)
    item.appendChild(right)
    listaMejoras.appendChild(item)
  })

  {
    const item = document.createElement("div")
    item.className = "item"
    const coste = 7
    item.innerHTML = `
      <div class="left">
        <span class="name">Contrato con proveedor</span>
        <span class="pill">Estado: ${juego.proveedor ? "Activo" : "Inactivo"}</span>
        <span class="pill">Coste ${coste}</span>
      </div>
    `
    const right = document.createElement("div")
    const btn = document.createElement("button")
    btn.className = "btn"
    btn.textContent = juego.proveedor ? "Comprado" : "Comprar"
    btn.disabled = juego.proveedor || juego.monedas < coste
    btn.onclick = ()=>{
      if(!juego.proveedor && juego.monedas>=coste){
        juego.monedas -= coste
        juego.proveedor = true
        renderTienda()
      }
    }
    right.appendChild(btn)
    item.appendChild(right)
    listaMejoras.appendChild(item)
  }

  {
    const item = document.createElement("div")
    item.className = "item"
    const coste = 8
    item.innerHTML = `
      <div class="left">
        <span class="name">Tirador automático</span>
        <span class="pill">Estado: ${juego.tiradorAutomatico ? "Activo" : "Inactivo"}</span>
        <span class="pill">Coste ${coste}</span>
      </div>
    `
    const right = document.createElement("div")
    const btn = document.createElement("button")
    btn.className = "btn"
    btn.textContent = juego.tiradorAutomatico ? "Comprado" : "Comprar"
    btn.disabled = juego.tiradorAutomatico || juego.monedas < coste
    btn.onclick = ()=>{
      if(!juego.tiradorAutomatico && juego.monedas>=coste){
        juego.monedas -= coste
        juego.tiradorAutomatico = true
        renderTienda()
      }
    }
    right.appendChild(btn)
    item.appendChild(right)
    listaMejoras.appendChild(item)
  }

  {
    const item = document.createElement("div")
    item.className = "item"
    const coste = 4
    item.innerHTML = `
      <div class="left">
        <span class="name">Cargas de doble tiro</span>
        <span class="pill">Disponibles: ${juego.cargasDobleTiro}</span>
        <span class="pill">Coste ${coste} / carga</span>
      </div>
    `
    const right = document.createElement("div")
    const btn = document.createElement("button")
    btn.className = "btn"
    btn.textContent = "Comprar 1 carga"
    btn.disabled = juego.monedas < coste
    btn.onclick = ()=>{
      if(juego.monedas>=coste){
        juego.monedas -= coste
        juego.cargasDobleTiro += 1
        renderTienda()
      }
    }
    right.appendChild(btn)
    item.appendChild(right)
    listaMejoras.appendChild(item)
  }

  actualizarInventarioPreparacion()
}

function iniciarRonda(){
  pantallaPreparacion.style.display = "none"
  pantallaRonda.style.display = "block"

  juego.tirosRestantes = totalCervezas()
  textoTiros.textContent = juego.tirosRestantes
  textoEstadoRonda.textContent = ""
  botonSiguienteRonda.style.display = "none"
  juego.clienteSeleccionadoId = null
  juego.tipoSeleccionadoParaTiro = null
  juego.usarDobleProximo = false
  juego.contadorTirosEfectuados = 0
  textoTipoTiroActual.textContent = "—"
  textoDobleRonda.textContent = juego.cargasDobleTiro
  textoMonedasRonda.textContent = juego.monedas

  const n = juego.rondasClientes[juego.rondaActual]
  juego.clientes = Array.from({length:n}, (_,i)=>crearCliente(i+1))

  textoTituloRonda.textContent = `Ronda ${juego.rondaActual+1} de ${juego.rondasClientes.length}`
  renderSelectorTipoTiro()
  renderClientes()
  actualizarInventarioRonda()
  escribirEnLog(`Empieza la ronda ${juego.rondaActual+1} con ${n} clientes`)
}

function crearCliente(id){
  const vip = Math.random()<0.2
  const tacano = Math.random()<0.2
  const impaciente = Math.random()<0.2
  const baseVida = 2 + (vip ? 2 : 0)
  const baseEscudo = 0
  return {
    id,
    nombre: `Cliente ${id}`,
    vida: baseVida,
    preferencia: TIPOS[Math.floor(Math.random()*TIPOS.length)],
    escudoPreferencia: baseEscudo,
    derrotado: false,
    rasgos: { vip, tacano, impaciente },
    turnosSinAtender: 0
  }
}

function renderSelectorTipoTiro(){
  selectorTipoTiro.innerHTML = ""
  TIPOS.forEach(tipo=>{
    const btn = document.createElement("button")
    btn.className = "opcion"
    btn.textContent = `${tipo} (${juego.inventario[tipo]})`
    btn.disabled = (juego.inventario[tipo] === 0)
    btn.onclick = ()=>{
      juego.tipoSeleccionadoParaTiro = tipo
      textoTipoTiroActual.textContent = tipo
      actualizarEstadoBotonLanzar()
      renderSelectorTipoTiro()
    }
    if(juego.tipoSeleccionadoParaTiro === tipo) btn.classList.add("activa")
    selectorTipoTiro.appendChild(btn)
  })
}

function renderClientes(){
  contenedorClientes.innerHTML = ""
  juego.clientes.forEach(c=>{
    const card = document.createElement("div")
    card.className = "cliente" + (c.derrotado?" muerto":"") + (juego.clienteSeleccionadoId===c.id?" sel":"")
    card.onclick = ()=>{
      if(c.derrotado) return
      juego.clienteSeleccionadoId = c.id
      renderClientes()
      actualizarEstadoBotonLanzar()
    }

    const barraHP = document.createElement("div")
    barraHP.className = "hp"
    barraHP.innerHTML = `<div style="width:${Math.max(0,(c.vida/ (c.rasgos.vip?7:5))*100)}%"></div>`

    const barraShield = document.createElement("div")
    barraShield.className = "shield"
    const maxEscudo = c.rasgos.vip ? 3 : 2
    barraShield.innerHTML = `<div style="width:${(c.escudoPreferencia / maxEscudo)*100}%"></div>`

    const rasgos = []
    if(c.rasgos.vip) rasgos.push("VIP")
    if(c.rasgos.tacano) rasgos.push("Tacaño")
    if(c.rasgos.impaciente) rasgos.push("Impaciente")

    card.innerHTML = `
      <div><b>${c.nombre}</b> ${rasgos.length?`<span class="pill badge">${rasgos.join(" · ")}</span>`:""}</div>
      <div class="muted">Prefiere: ${c.preferencia} · Escudo: ${c.escudoPreferencia}</div>
    `
    card.appendChild(barraHP)
    card.appendChild(barraShield)
    contenedorClientes.appendChild(card)
  })
}

function actualizarEstadoBotonLanzar(){
  const okCliente = !!juego.clienteSeleccionadoId
  const okTipo = !!juego.tipoSeleccionadoParaTiro
  botonLanzar.disabled = !(okCliente && okTipo && juego.tirosRestantes>0)
}

botonUsarDoble.onclick = ()=>{
  if(juego.cargasDobleTiro<=0){
    toast("No tienes cargas de doble tiro")
    return
  }
  juego.usarDobleProximo = !juego.usarDobleProximo
  toast(juego.usarDobleProximo ? "Doble tiro activado" : "Doble tiro cancelado")
}

function danioConMejora(tipo){
  return DANO_TIPO[tipo] + (juego.mejorasDanio[tipo]||0)
}

function calcularEfectoSobreCliente(cliente, tipo){
  if(cliente.escudoPreferencia > 0){
    if(tipo === cliente.preferencia){
      return {escudo:1, vida:0}
    } else {
      return {escudo:0, vida:0}
    }
  }
  const d = (tipo === cliente.preferencia) ? danioConMejora(tipo) : 1
  return {escudo:0, vida:d}
}

function calcularPagoVenta(cliente, tipo){
  let pago = PRECIO_VENTA[tipo] + juego.reputacion
  if(cliente.rasgos.tacano && tipo !== cliente.preferencia) pago = Math.max(0, pago-1)
  if(cliente.rasgos.vip) pago += 1
  return pago
}

function obtenerClienteVivoAleatorio(exceptId=null){
  const vivos = juego.clientes.filter(c=>!c.derrotado && c.id!==exceptId)
  if(vivos.length===0) return null
  return vivos[Math.floor(Math.random()*vivos.length)]
}

function aplicarEventoAleatorio(){
  if(Math.random() > PROB_EVENTO) return
  const tipo = Math.floor(Math.random()*3)
  if(tipo===0){

    const a = obtenerClienteVivoAleatorio()
    const b = obtenerClienteVivoAleatorio(a?.id||null)
    if(!a || !b) return
    a.vida = Math.max(0, a.vida-2)
    b.vida = Math.max(0, b.vida-2)
    escribirEnLog(`Evento: ${a.nombre} y ${b.nombre} se pelean (-2 vida c/u)`)
    if(a.vida===0) a.derrotado = true
    if(b.vida===0) b.derrotado = true
  } else if(tipo===1){

    const c = obtenerClienteVivoAleatorio()
    if(!c) return
    c.escudoPreferencia = 0
    escribirEnLog(`Evento: ${c.nombre} derrama su bebida. ¡Escudo a 0!`)
  } else {

    juego.reputacion += 1
    escribirEnLog(`Evento: sube tu reputación (+1). Ventas más valiosas.`)
    textoReputacion.textContent = juego.reputacion
    textoMonedasRonda.textContent = juego.monedas
  }
}

function procesarImpacientes(idObjetivo){
  juego.clientes.forEach(c=>{
    if(c.derrotado) return
    if(c.id===idObjetivo){ c.turnosSinAtender = 0; return }
    c.turnosSinAtender++
    if(c.rasgos.impaciente && c.turnosSinAtender>=2){

      if(juego.monedas>0) { juego.monedas -= 1; textoMonedasRonda.textContent = juego.monedas }
      escribirEnLog(`${c.nombre} (impaciente) te hace perder 1 moneda`)
      c.turnosSinAtender = 0
    }
  })
}

function tirarAutomatico(tipo){
  if(!juego.tiradorAutomatico) return
  if(juego.contadorTirosEfectuados % 3 !== 0) return
  const objetivo = obtenerClienteVivoAleatorio()
  if(!objetivo) return
  const efecto = calcularEfectoSobreCliente(objetivo, tipo)
  const pago = calcularPagoVenta(objetivo, tipo)
  juego.monedas += pago
  if(efecto.escudo>0){
    objetivo.escudoPreferencia = Math.max(0, objetivo.escudoPreferencia-efecto.escudo)
  }
  if(efecto.vida>0){
    objetivo.vida = Math.max(0, objetivo.vida-efecto.vida)
    if(objetivo.vida===0) objetivo.derrotado = true
  }
  escribirEnLog(`Tirador automático vende ${tipo} a ${objetivo.nombre} (+${pago} monedas)`)
}

function lanzarTiroSimple(cliente, tipo){

  const pago = calcularPagoVenta(cliente, tipo)
  juego.monedas += pago
  textoMonedasRonda.textContent = juego.monedas
  escribirEnLog(`Vendes ${tipo} a ${cliente.nombre} por ${pago} monedas`)

  juego.inventario[tipo]--
  juego.tirosRestantes--
  juego.contadorTirosEfectuados++
  textoTiros.textContent = juego.tirosRestantes

  const efecto = calcularEfectoSobreCliente(cliente, tipo)
  if(efecto.escudo>0){
    cliente.escudoPreferencia = Math.max(0, cliente.escudoPreferencia-efecto.escudo)
    escribirEnLog(`${cliente.nombre} reduce escudo a ${cliente.escudoPreferencia}`)
  }
  if(efecto.vida>0){
    cliente.vida = Math.max(0, cliente.vida-efecto.vida)
    escribirEnLog(`${cliente.nombre} recibe ${efecto.vida}. Vida: ${cliente.vida}`)
    if(cliente.vida===0){
      cliente.derrotado = true
      escribirEnLog(`${cliente.nombre} cae borracho`)
    }
  }

  tirarAutomatico(tipo)

  procesarImpacientes(cliente.id)
}

function lanzar(){
  if(juego.tirosRestantes<=0) return
  const cliente = juego.clientes.find(x=>x.id===juego.clienteSeleccionadoId)
  if(!cliente || cliente.derrotado) return
  const tipo = juego.tipoSeleccionadoParaTiro
  if(!tipo || juego.inventario[tipo] <= 0) return

  let disparos = 1
  if(juego.usarDobleProximo && juego.cargasDobleTiro>0){
    disparos = 2
    juego.cargasDobleTiro--
    juego.usarDobleProximo = false
    textoDobleRonda.textContent = juego.cargasDobleTiro
    toast("¡Doble tiro!")
  }

  for(let i=0;i<disparos;i++){

    if(juego.inventario[tipo] <= 0 || juego.tirosRestantes<=0) break

    let objetivo = cliente
    if(i>0 && objetivo.derrotado){
      const otro = obtenerClienteVivoAleatorio()
      if(!otro) break
      objetivo = otro
    }

    lanzarTiroSimple(objetivo, tipo)
  }

  juego.clienteSeleccionadoId = null
  renderClientes()
  renderSelectorTipoTiro()
  actualizarInventarioRonda()
  actualizarEstadoBotonLanzar()

  aplicarEventoAleatorio()
  renderClientes()

  comprobarFinDeRonda()
}

function comprobarFinDeRonda(){
  const hayVivos = juego.clientes.some(c=>!c.derrotado)
  const hayInventario = totalCervezas() > 0

  if(!hayVivos){
    textoEstadoRonda.textContent = "Ronda superada"
    terminarRonda(true)
    return
  }
  if(!hayInventario){
    textoEstadoRonda.textContent = "Sin cervezas"
    terminarRonda(false)
  }
}

function terminarRonda(superada){
  botonLanzar.disabled = true

  const pagarGastos = ()=>{
    let totalGasto = GASTO_SUMINISTROS
    if(!superada) totalGasto += GASTO_ALQUILER_FALLO
    if(totalCervezas()===0) totalGasto += GASTO_ALQUILER_SIN_MATERIALES
    if(totalGasto>0){
      juego.monedas -= totalGasto
      escribirEnLog(`Gastos del bar: -${totalGasto} monedas`)
    }
  }

  if(superada){

    abrirRecompensas(()=>{

      if(juego.rondaActual < juego.rondasClientes.length-1){
        botonSiguienteRonda.style.display = "inline-block"
      }else{
        botonSiguienteRonda.style.display = "none"
        textoEstadoRonda.textContent += " · Fin del juego"
        escribirEnLog("Fin del juego")
      }
    })
  }else{

    pagarGastos()
    volverATienda()
  }
}

function abrirRecompensas(onClose){

  const pool = [
    {id:"monedas5", txt:"+5 monedas", apply:()=>{ juego.monedas+=5 }},
    {id:"reputacion1", txt:"+1 reputación (mejora precio de venta)", apply:()=>{ juego.reputacion+=1 }},
    {id:"doble1", txt:"+1 carga de doble tiro", apply:()=>{ juego.cargasDobleTiro+=1 }},
    {id:"mejoraAleatoria", txt:"Mejora de daño aleatoria (+1)", apply:()=>{
      const t = TIPOS[Math.floor(Math.random()*TIPOS.length)]
      juego.mejorasDanio[t] = Math.min(2, juego.mejorasDanio[t]+1)
      escribirEnLog(`Daño mejorado en ${t}`)
    }},
    {id:"packCervezas", txt:"+2 cervezas aleatorias", apply:()=>{
      for(let i=0;i<2;i++){
        const t = TIPOS[Math.floor(Math.random()*TIPOS.length)]
        juego.inventario[t]++
      }
    }},
    ...(juego.proveedor?[]:[{id:"proveedor", txt:"Contrato con proveedor (compras -1)", apply:()=>{ juego.proveedor=true }}]),
    ...(juego.tiradorAutomatico?[]:[{id:"auto", txt:"Tirador automático (1 gratis cada 3)", apply:()=>{ juego.tiradorAutomatico=true }}]),
  ]

  const opciones = []
  while(opciones.length<3 && pool.length>0){
    const i = Math.floor(Math.random()*pool.length)
    opciones.push(pool.splice(i,1)[0])
  }

  contenedorRecompensas.innerHTML = ""
  opciones.forEach(op=>{
    const row = document.createElement("div")
    row.className = "item"
    row.innerHTML = `<div class="left"><span class="name">${op.txt}</span></div>`
    const right = document.createElement("div")
    const btn = document.createElement("button")
    btn.className = "btn primary"
    btn.textContent = "Elegir"
    btn.onclick = ()=>{
      op.apply()
      cerrarRecompensas()
      if(typeof onClose==="function") onClose()
      textoMonedasRonda.textContent = juego.monedas
      textoReputacion.textContent = juego.reputacion
      textoDobleRonda.textContent = juego.cargasDobleTiro
      renderSelectorTipoTiro()
      actualizarInventarioRonda()
    }
    right.appendChild(btn)
    row.appendChild(right)
    contenedorRecompensas.appendChild(row)
  })

  modalRecompensa.style.display = "flex"
}

function cerrarRecompensas(){
  modalRecompensa.style.display = "none"
}

botonCerrarModal.onclick = cerrarRecompensas

function volverATienda(){
  pantallaRonda.style.display = "none"
  pantallaPreparacion.style.display = "block"
  textoMonedas.textContent = juego.monedas
  renderTienda()
  actualizarInventarioPreparacion()
  actualizarBotonEmpezar()

  const puedeComprar = TIPOS.some(t=>juego.monedas >= precioCompra(t))
  if(!puedeComprar && totalCervezas()===0){
    escribirEnLog("Te has arruinado. Fin del juego.")
    botonEmpezar.disabled = true
  }
}

botonEmpezar.onclick = iniciarRonda
botonLanzar.onclick = lanzar
botonSiguienteRonda.onclick = ()=>{

  juego.rondaActual++

  juego.monedas -= GASTO_SUMINISTROS
  escribirEnLog(`Gastos de suministros: -${GASTO_SUMINISTROS} monedas`)
  iniciarRonda()
}

renderTienda()
actualizarInventarioPreparacion()
actualizarBotonEmpezar()
