import {
    auth,
    db,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    doc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    updateDoc,
query,
where,
limit,
    deleteDoc
} from "./firebase.js";

/*=========================================================
CONTROL DE COBROS OPERATIVOS
Versión 0.1.0 Alpha
=========================================================*/



/*=========================================================
VARIABLES
=========================================================*/

const splashScreen = document.getElementById("splashScreen");
const app = document.getElementById("app");

const loadingText = document.getElementById("loadingText");
let usuarioActual = null;

/*=========================================================
CONFIGURACIÓN GENERAL
=========================================================*/


const mensajes = [

    "Preparando interfaz...",

    "Cargando listado de facturas...",

    "Inicializando módulos...",

    "Preparando Dashboard...",

    "Conectando con la base de datos..."

];



let indiceMensaje = 0;



/*=========================================================
INICIO
=========================================================*/

iniciarSistema();



function iniciarSistema(){

    cambiarMensaje();

}



/*=========================================================
SPLASH
=========================================================*/

function cambiarMensaje(){

    const intervalo = setInterval(()=>{

        indiceMensaje++;

        if(indiceMensaje < mensajes.length){

            loadingText.textContent = mensajes[indiceMensaje];

        }

    },900);



    setTimeout(()=>{

        clearInterval(intervalo);

        abrirSistema();

    },4500);

}



function abrirSistema(){

    splashScreen.style.display = "none";

   
}

/*=========================================================
NAVEGACIÓN
=========================================================*/

const btnResumen = document.getElementById("btnResumen");
const btnCobros = document.getElementById("btnCobros");
const btnBloqueados = document.getElementById("btnBloqueados");
const btnConfig = document.getElementById("btnConfig");


const panelResumen = document.getElementById("panelResumen");
const panelCobros = document.getElementById("panelCobros");
const panelBloqueados = document.getElementById("panelBloqueados");
const panelConfig = document.getElementById("panelConfig");


btnResumen.addEventListener("click", () => cambiarPanel("resumen"));
btnCobros.addEventListener("click", () => cambiarPanel("cobros"));
btnBloqueados.addEventListener("click", () => cambiarPanel("bloqueados"));
btnConfig.addEventListener("click", () => cambiarPanel("config"));


function cambiarPanel(panel){

    ocultarPaneles();

    desactivarBotones();

    switch(panel){

        case "resumen":

            panelResumen.classList.remove("panelOculto");
            panelResumen.classList.add("panelActivo");

            btnResumen.classList.add("active");

            break;


        case "cobros":

            panelCobros.classList.remove("panelOculto");
            panelCobros.classList.add("panelActivo");

            btnCobros.classList.add("active");

            break;


        case "bloqueados":

            panelBloqueados.classList.remove("panelOculto");
            panelBloqueados.classList.add("panelActivo");

            btnBloqueados.classList.add("active");

            break;


        case "config":

            panelConfig.classList.remove("panelOculto");
            panelConfig.classList.add("panelActivo");

            btnConfig.classList.add("active");

            break;

    }

}



function ocultarPaneles(){

    const paneles = [

        panelResumen,
        panelCobros,
        panelBloqueados,
        panelConfig

    ];

    paneles.forEach(panel=>{

        panel.classList.remove("panelActivo");
        panel.classList.add("panelOculto");

    });

}



function desactivarBotones(){

    const botones = [

        btnResumen,
        btnCobros,
        btnBloqueados,
        btnConfig

    ];

    botones.forEach(boton=>{

        boton.classList.remove("active");

    });

}

/*=========================================================
DATOS DE PRUEBA
=========================================================*/

let cobros = [];



const datosPrueba = [

    {
        id:"FAC-0001",
        codigo:"1001",
        cliente:"Ferretería Central",
        ruta:"Santiago",
        vendedor:"Eduardo",
        contacto:"",
        telefono:"",
        factura:"FA-000154",
        monto:850.75,
        fechaFactura:"2026-08-01",
        entrega:"2026-08-01",
        plazo:15,
        notas:"",
        pagado:false
    },

    {
        id:"FAC-0002",
        codigo:"1058",
        cliente:"Auto Repuestos Díaz",
        ruta:"Chitré",
        vendedor:"Abraham",
        contacto:"",
        telefono:"",
        factura:"FA-000161",
        monto:1245.90,
        fechaFactura:"2026-08-03",
        entrega:"2026-08-03",
        plazo:7,
        notas:"",
        pagado:false
    },

    {
        id:"FAC-0003",
        codigo:"1095",
        cliente:"Comercial López",
        ruta:"Las Tablas",
        vendedor:"Abdiel",
        contacto:"",
        telefono:"",
        factura:"FA-000167",
        monto:412.60,
        fechaFactura:"2026-07-28",
        entrega:"2026-07-28",
        plazo:5,
        notas:"",
        pagado:false
    }

];


function inicializarDatos(){

    if(CONFIG.modoDesarrollo){

        cobros = structuredClone(datosPrueba);

    }else{

        cobros = [];

    }

}

/*=========================================================
CARGAR TABLA
=========================================================*/

const tbodyCobros=document.getElementById("tbodyCobros");



cargarCobros();

/*=========================================================
INTELIGENCIA DE COBRO
=========================================================*/

function obtenerEstado(cliente){

    if(cliente.pagado){

        return "gris";

    }

    const dias = obtenerDiasNumericos(cliente);

    if(dias <= 0){

        return "rojo";

    }

    if(dias <= 3){

        return "amarillo";

    }

    return "verde";

}

function obtenerDiasNumericos(cliente){

    const hoy = new Date();
    const fechaCobro = obtenerFechaVencimiento(cliente);

    return Math.ceil(
        (fechaCobro - hoy) / (1000 * 60 * 60 * 24)
    );
}

/*=========================================================
FECHA DE VENCIMIENTO
=========================================================*/

function obtenerFechaVencimiento(cliente){

    if(
        cliente.chequePosfechado === true &&
        cliente.fechaCheque
    ){

        return new Date(cliente.fechaCheque);

    }

    const fecha = new Date(cliente.entrega);

    fecha.setDate(
        fecha.getDate() + Number(cliente.plazo)
    );

    return fecha;

}function obtenerDiasRestantes(cliente){

    const dias = obtenerDiasNumericos(cliente);

    if(cliente.pagado){
        return "Pagado";
    }

    if(dias < 0){
        return "Vencido";
    }

    if(dias === 0){
        return "Hoy";
    }

    if(dias === 1){
        return "1 día";
    }

    return dias + " días";
}


function cargarCobros(lista = cobros){

    tbodyCobros.innerHTML="";
lista = [...lista].sort((a,b)=>{

    const prioridad =
        prioridadEstado(a)-prioridadEstado(b);

    if(prioridad!==0){

        return prioridad;

    }

    return obtenerDiasNumericos(a)-obtenerDiasNumericos(b);

});

   lista.forEach(cobro=>{

    const index = cobros.indexOf(cobro);

        tbodyCobros.innerHTML+=`

<tr class="estado${capitalizar(obtenerEstado(cobro))}">

<td>
    ${iconoEstado(obtenerEstado(cobro))}
    ${
        cobro.chequePosfechado && !cobro.pagado
            ? "Cheque posfechado"
            : convertirEstadoFiltro(
                obtenerEstado(cobro),
                cobro
              )
    }
</td>

<td>${cobro.codigo}</td>

<td>${cobro.cliente}</td>

<td>${cobro.ruta}</td>

<td>${cobro.vendedor}</td>

<td>${cobro.factura}</td>

<td>B/. ${(cobro.saldoPendiente ?? cobro.monto).toFixed(2)}</td>

<td>
    ${
        cobro.chequePosfechado
            ? "—"
            : `${cobro.plazo} días`
    }
</td>

<td>${cobro.entrega}</td>

<td>${formatearFecha(obtenerFechaVencimiento(cobro))}</td>

<td>${obtenerDiasRestantes(cobro)}</td>

<td>

<button
    type="button"
    class="btnNotas"
    data-id="${cobro.id}">

    📝

</button>

</td>

<td>

<input
type="checkbox"
class="checkPagado"
data-id="${cobro.id}">

</td>

<td class="accionesFactura">

    <button
        type="button"
        class="btnEditarFactura"
        data-id="${cobro.id}">

        Editar

    </button>

    <button
        type="button"
        class="btnAnularFactura"
        data-id="${cobro.id}">

        Anular

    </button>

</td>

</tr>
`;

    });
aplicarPermisos();
}



/*=========================================================
UTILIDADES
=========================================================*/

function capitalizar(texto){

    return texto.charAt(0).toUpperCase()+texto.slice(1);

}



function iconoEstado(estado){

    switch(estado){

        case "verde":
            return "🟢";

        case "amarillo":
            return "🟡";

        case "rojo":
            return "🔴";

        default:
            return "";

    }

}

/*=========================================================
MODAL NOTAS
=========================================================*/

const modalNotas = document.getElementById("modalNotas");
const txtNotas = document.getElementById("txtNotas");

const btnGuardarNotas = document.getElementById("btnGuardarNotas");
const btnCerrarNotas = document.getElementById("btnCerrarNotas");





let idFacturaNotas = null;
btnCerrarNotas.addEventListener("click", function(){

    idFacturaNotas = null;
    txtNotas.value = "";

    cerrarNotas();

});
function abrirNotas(idFactura){

    const factura = cobros.find(
        item => item.id === idFactura
    );

    if(!factura){
        return;
    }

    idFacturaNotas = idFactura;
    txtNotas.value = factura.notas || "";

    modalNotas.classList.remove("hidden");

}


function cerrarNotas(){

    modalNotas.classList.add("hidden");

}



btnGuardarNotas.addEventListener(
    "click",
    guardarNotas
);


async function guardarNotas(){

    if(!idFacturaNotas){
        return;
    }

    const factura = cobros.find(
        item => item.id === idFacturaNotas
    );

    if(!factura){
        return;
    }

    const notaNueva = txtNotas.value.trim();
    const notaAnterior = factura.notas || "";

    try{

        await updateDoc(
            doc(db, "facturas", idFacturaNotas),
            {
                notas: notaNueva,
                fechaActualizacionNota:
                    new Date().toISOString(),
                notaActualizadaPor:
                    usuarioActual.correo
            }
        );

        await registrarAuditoria(
            notaAnterior
                ? "NOTA MODIFICADA"
                : "NOTA AGREGADA",
            factura,
            `Nota anterior: ${notaAnterior || "Sin nota"}. ` +
            `Nota nueva: ${notaNueva || "Nota eliminada"}.`
        );

        idFacturaNotas = null;

        await cargarCobrosFirestore();

        cerrarNotas();

    }catch(error){

        console.error(
            "Error guardando nota:",
            error
        );

        alert("No se pudo guardar la nota.");

    }

}




/*=========================================================
MODAL HISTORIAL
=========================================================*/

const modalHistorial = document.getElementById("modalHistorial");

const btnHistorial = document.getElementById("btnHistorial");
const btnCerrarHistorial = document.getElementById("btnCerrarHistorial");
const btnExportarHistorial =
    document.getElementById("btnExportarHistorial");
const cmbVendedorHistorial =
    document.getElementById("cmbVendedorHistorial");
btnExportarHistorial.addEventListener(
    "click",
    exportarHistorialExcel
);
cmbVendedorHistorial.addEventListener(
    "change",
    cargarHistorial
);

btnHistorial.addEventListener("click", async ()=>{

    await cargarHistorialFirestore();

    modalHistorial.classList.remove("hidden");

});


btnCerrarHistorial.addEventListener("click",()=>{

    modalHistorial.classList.add("hidden");

});


function exportarHistorialExcel(){

    const vendedorSeleccionado =
    cmbVendedorHistorial.value;

    const resultados =
        historial.filter(item =>

            !vendedorSeleccionado ||
            item.vendedor === vendedorSeleccionado

        );


    if(resultados.length === 0){

        alert(
            "No hay pagos para exportar con el vendedor seleccionado."
        );

        return;

    }


    const datosExcel =
        resultados.map(item => ({

            "Factura":
                item.factura || "",

            "Cliente":
                item.cliente || "",

            "Vendedor":
                item.vendedor || "",

            "Ruta":
                item.ruta || "",

            "Recibo":
                item.numeroRecibo || "",

            "Monto":
                Number(item.monto || 0),

            "Tipo":
                item.tipo || "",

            "Saldo Anterior":
                Number(item.saldoAnterior || 0),

            "Saldo Posterior":
                Number(item.saldoPosterior || 0),

            "Fecha de Pago":
                item.fechaPago
                    ? new Date(item.fechaPago)
                        .toLocaleString("es-PA")
                    : ""

        }));


    const hoja =
        XLSX.utils.json_to_sheet(
            datosExcel
        );


    const libro =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        libro,
        hoja,
        "Historial de Pagos"
    );


    const nombreVendedor =
        vendedorSeleccionado
            ? vendedorSeleccionado.replace(
                /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g,
                ""
              )
            : "Todos";


    const fecha =
        new Date()
            .toISOString()
            .slice(0,10);


    XLSX.writeFile(
        libro,
        `Historial_Pagos_${nombreVendedor}_${fecha}.xlsx`
    );

}


/*=========================================================
MODAL CONFIRMACIÓN
=========================================================*/

const modalConfirmacion=document.getElementById("modalConfirmacion");

const btnAceptar=document.getElementById("btnAceptar");
const btnCancelar=document.getElementById("btnCancelar");

const lblConfirmacion=document.getElementById("lblConfirmacion");



let pagoPendiente = null;
let accionPendiente = "";

document.addEventListener("change", function(event){

    if(!event.target.classList.contains("checkPagado")){
        return;
    }

    const check = event.target;

    if(!check.checked){
        return;
    }

    check.checked = false;

    solicitarPago(check.dataset.id);

});


function solicitarPago(idFactura){

    if(!puedeAlimentar()){
        return;
    }

    const factura = cobros.find(
        item => item.id === idFactura
    );

    if(!factura){
        return;
    }

    const saldoActual = Number(
        factura.saldoPendiente ?? factura.monto
    );

   const entrada = prompt(
    `Saldo pendiente: B/. ${saldoActual.toFixed(2)}\n\n` +
    "Ingrese el monto recibido:"
);

if(entrada === null){
    return;
}

const numeroRecibo = prompt(
    "Ingrese el número de recibo:"
);

if(
    numeroRecibo === null ||
    !numeroRecibo.trim()
){
    alert("El número de recibo es obligatorio.");
    return;
}

    if(entrada === null){
        return;
    }

    const montoPago = Number(
        String(entrada).replace(",", ".")
    );

    if(
        !Number.isFinite(montoPago) ||
        montoPago <= 0 ||
        montoPago > saldoActual
    ){

        alert("Ingrese un monto válido, no mayor que el saldo pendiente.");
        return;

    }

    pagoPendiente = {
        idFactura,
        montoPago,
        saldoAnterior: saldoActual,
       numeroRecibo: numeroRecibo.trim()
    };

    accionPendiente = "PAGO";

    const saldoNuevo = saldoActual - montoPago;

    lblConfirmacion.textContent =
        saldoNuevo <= 0
            ? `¿Confirma el pago total de B/. ${montoPago.toFixed(2)}?`
            : `¿Confirma el abono de B/. ${montoPago.toFixed(2)}? ` +
              `Quedará un saldo de B/. ${saldoNuevo.toFixed(2)}.`;

    modalConfirmacion.classList.remove("hidden");

}

/*=========================================================
REGISTRAR PAGO
=========================================================*/




/*=========================================================
HISTORIAL
=========================================================*/

let historial=[];



function moverHistorial(cliente){

    historial.push({

        ...cliente,

        fechaPago:fechaActual(),

        usuario:"Administrador"

    });

}



/*=========================================================
TABLA HISTORIAL
=========================================================*/

const tbodyHistorial=document.getElementById("tbodyHistorial");

function cargarVendedoresHistorial(){

    const vendedorActual =
        cmbVendedorHistorial.value;

    const vendedores = [
        ...new Set(
            historial
                .map(item => item.vendedor)
                .filter(Boolean)
        )
    ].sort();


    cmbVendedorHistorial.innerHTML =
        `<option value="">Todos los vendedores</option>`;


    vendedores.forEach(vendedor => {

        cmbVendedorHistorial.innerHTML +=
            `<option value="${vendedor}">
                ${vendedor}
            </option>`;

    });


    if(vendedores.includes(vendedorActual)){

        cmbVendedorHistorial.value =
            vendedorActual;

    }

}

function cargarHistorial(){

    tbodyHistorial.innerHTML="";

    const vendedorSeleccionado =
        cmbVendedorHistorial.value;

    const listaFiltrada =
        vendedorSeleccionado
            ? historial.filter(
                item => item.vendedor === vendedorSeleccionado
              )
            : historial;


    listaFiltrada.forEach(item=>{

        tbodyHistorial.innerHTML+=`

<tr>

<td>${item.factura}</td>

<td>${item.cliente}</td>

<td>${item.ruta}</td>

<td>${item.vendedor}</td>

<td>B/. ${item.monto.toFixed(2)}</td>

<td>${item.fechaPago}</td>

<td>${item.usuario}</td>

</tr>

`;

    });

}
async function cargarHistorialFirestore(){

    try{

        const resultado = await getDocs(
            collection(db, "pagos")
        );

        historial = resultado.docs
            .map(documento => ({
                id: documento.id,
                ...documento.data()
            }))
            .sort((a,b) =>
                new Date(b.fechaPago) -
                new Date(a.fechaPago)
            );
cargarVendedoresHistorial();
cargarHistorial();
        

    }catch(error){

        console.error(
            "Error cargando historial:",
            error
        );

    }

}

/*=========================================================
UTILIDADES
=========================================================*/

function fechaActual(){

    const hoy=new Date();

    return hoy.toLocaleDateString("es-PA");

}

function formatearFecha(fecha){

    return fecha.toLocaleDateString("es-PA");

}

/*=========================================================
MOTOR DE ACCIONES
=========================================================*/

btnAceptar.addEventListener("click", ejecutarAccion);



function ejecutarAccion(){

    modalConfirmacion.classList.add("hidden");

   switch(accionPendiente){

    case "PAGO":

        ejecutarPago();

        break;

    case "ANULAR":

        ejecutarAnulacion();

        break;
case "CERRAR_CONFIG":

break;
}

}



async function ejecutarPago(){

    if(!pagoPendiente){
        return;
    }

    const factura = cobros.find(
        item => item.id === pagoPendiente.idFactura
    );

    if(!factura){
        pagoPendiente = null;
        return;
    }

    const saldoNuevo = Number(
        (
            pagoPendiente.saldoAnterior -
            pagoPendiente.montoPago
        ).toFixed(2)
    );

    const pagoTotal = saldoNuevo <= 0;

    try{

        await updateDoc(
            doc(db, "facturas", factura.id),
            {
                saldoPendiente: pagoTotal ? 0 : saldoNuevo,

                montoPagado:
                    Number(factura.montoPagado || 0) +
                    pagoPendiente.montoPago,

                pagado: pagoTotal,

                estado: pagoTotal
                    ? "pagada"
                    : "activa",

                fechaUltimoPago:
                    new Date().toISOString(),

                actualizadoPor:
                    usuarioActual.correo
            }
        );

        await addDoc(
            collection(db, "pagos"),
            {
                facturaId: factura.id,
                factura: factura.factura,
                cliente: factura.cliente,
                ruta: factura.ruta,
                vendedor: factura.vendedor,
		numeroRecibo: pagoPendiente.numeroRecibo,
                monto: pagoPendiente.montoPago,
                saldoAnterior:
                    pagoPendiente.saldoAnterior,
                saldoPosterior:
                    pagoTotal ? 0 : saldoNuevo,
                tipo: pagoTotal
                    ? "pago total"
                    : "abono",
                fechaPago:
                    new Date().toISOString(),
                usuario:
                    usuarioActual.correo
            }
        );
await registrarAuditoria(

    pagoTotal
        ? "PAGO TOTAL"
        : "ABONO",

    factura,

    `Recibo: ${pagoPendiente.numeroRecibo}. ` +
    `Monto recibido: B/. ${pagoPendiente.montoPago.toFixed(2)}. ` +
    `Saldo anterior: B/. ${pagoPendiente.saldoAnterior.toFixed(2)}. ` +
    `Saldo posterior: B/. ${(pagoTotal ? 0 : saldoNuevo).toFixed(2)}.`

);

        pagoPendiente = null;

        await cargarCobrosFirestore();
        await cargarHistorialFirestore();

    }catch(error){

        console.error(
            "Error registrando pago:",
            error
        );

        alert("No se pudo registrar el pago.");

    }

}
async function ejecutarAnulacion(){

    const idFactura = modalConfirmacion.dataset.idFactura;

    const factura = cobros.find(
        item => item.id === idFactura
    );

    if(!factura){
        return;
    }

    const motivo = prompt(
        "Escriba el motivo de la anulación:"
    );

    if(!motivo || !motivo.trim()){
        return;
    }

    try{

        await updateDoc(
            doc(db, "facturas", idFactura),
            {
                estado: "anulada",
                anulada: true,
                motivoAnulacion: motivo.trim(),
                fechaAnulacion: new Date().toISOString(),
                usuarioAnulacion:
                    usuarioActual?.correo || "desconocido"
            }

        );
await registrarAuditoria(

    "FACTURA ANULADA",

    factura,

    `Motivo: ${motivo.trim()}`

);
        modalConfirmacion.removeAttribute("data-id-factura");

        await cargarCobrosFirestore();

    }catch(error){

        console.error(
            "Error anulando factura:",
            error
        );

        alert("No se pudo anular la factura.");

    }

}
/*=========================================================
DASHBOARD
=========================================================*/

function actualizarDashboard(){



    document.getElementById("lblPendienteTotal").textContent=

        "B/. "+totalPendiente().toFixed(2);



    document.getElementById("lblEnPlazo").textContent=

        contarEstado("verde");



    document.getElementById("lblProximos").textContent=

        contarEstado("amarillo");



    document.getElementById("lblVencidos").textContent=

        contarEstado("rojo");



    document.getElementById("lblCobradoMes").textContent=

        "B/. "+totalCobrado().toFixed(2);

}



/*=========================================================
CÁLCULOS
=========================================================*/

function totalPendiente(){

    let total=0;

    cobros.forEach(c=>{

        total+=c.monto;

    });

    return total;

}



function totalCobrado(){

    let total=0;

    historial.forEach(c=>{

        total+=c.monto;

    });

    return total;

}



function contarEstado(estado){

    return cobros.filter(cobro =>
        obtenerEstado(cobro) === estado
    ).length;

}


/*=========================================================
INICIALIZACIÓN
=========================================================*/

actualizarDashboard();

/*=========================================================
BUSCADOR Y FILTROS
=========================================================*/

const txtBuscar = document.getElementById("txtBuscar");
const cmbVendedor = document.getElementById("cmbVendedor");
const cmbRuta = document.getElementById("cmbRuta");
const cmbEstado = document.getElementById("cmbEstado");
const btnExportarPendientes =
    document.getElementById("btnExportarPendientes");

txtBuscar.addEventListener("input", aplicarFiltros);
cmbVendedor.addEventListener("change", aplicarFiltros);
cmbRuta.addEventListener("change", aplicarFiltros);
cmbEstado.addEventListener("change", aplicarFiltros);
btnExportarPendientes.addEventListener(
    "click",
    exportarPendientesExcel
);


function aplicarFiltros(){

    const texto = normalizarTexto(txtBuscar.value);
    const vendedor = cmbVendedor.value;
    const ruta = cmbRuta.value;
    const estado = cmbEstado.value;

    const resultados = cobros.filter(cobro=>{

        const coincideTexto =
            !texto ||
            normalizarTexto(cobro.codigo).includes(texto) ||
            normalizarTexto(cobro.cliente).includes(texto) ||
            normalizarTexto(cobro.ruta).includes(texto) ||
            normalizarTexto(cobro.vendedor).includes(texto) ||
            normalizarTexto(cobro.factura).includes(texto);

        const coincideVendedor =
            !vendedor ||
            cobro.vendedor === vendedor;

        const coincideRuta =
            !ruta ||
            cobro.ruta === ruta;

        const coincideEstado =
            !estado ||
            convertirEstadoFiltro(
    obtenerEstado(cobro),
    cobro
) === estado

        return (
            coincideTexto &&
            coincideVendedor &&
            coincideRuta &&
            coincideEstado
        );

    });

    cargarCobros(resultados);

}

function exportarPendientesExcel(){

    const texto =
        normalizarTexto(txtBuscar.value);

    const vendedor =
        cmbVendedor.value;

    const ruta =
        cmbRuta.value;

    const estado =
        cmbEstado.value;


    const resultados = cobros.filter(cobro => {

        const coincideTexto =
            !texto ||
            normalizarTexto(cobro.codigo).includes(texto) ||
            normalizarTexto(cobro.cliente).includes(texto) ||
            normalizarTexto(cobro.ruta).includes(texto) ||
            normalizarTexto(cobro.vendedor).includes(texto) ||
            normalizarTexto(cobro.factura).includes(texto);

        const coincideVendedor =
            !vendedor ||
            cobro.vendedor === vendedor;

        const coincideRuta =
            !ruta ||
            cobro.ruta === ruta;

        const coincideEstado =
            !estado ||
            convertirEstadoFiltro(
    obtenerEstado(cobro),
    cobro
) === estado;

        return (
            coincideTexto &&
            coincideVendedor &&
            coincideRuta &&
            coincideEstado
        );

    });


    if(resultados.length === 0){

        alert(
            "No hay cobros pendientes para exportar con los filtros seleccionados."
        );

        return;

    }


    const datosExcel =
        resultados.map(cobro => ({

            "Código":
                cobro.codigo || "",

            "Cliente":
                cobro.cliente || "",

            "Vendedor":
                cobro.vendedor || "",

            "Ruta":
                cobro.ruta || "",

            "Factura":
                cobro.factura || "",

            "Monto":
                Number(cobro.monto || 0),

            "Saldo":
                Number(
                    cobro.saldoPendiente ??
                    cobro.monto ??
                    0
                ),

            "Plazo":
                Number(cobro.plazo || 0),

            "Fecha Fac.":
                cobro.fechaFactura || "",

            "Fecha Entrega":
                cobro.entrega || "",

            "Vence":
                formatearFecha(
                    obtenerFechaVencimiento(cobro)
                )

        }));


    const hoja =
        XLSX.utils.json_to_sheet(
            datosExcel
        );


    const libro =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        libro,
        hoja,
        "Cobros Pendientes"
    );


    const nombreVendedor =
        vendedor
            ? vendedor.replace(
                /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g,
                ""
              )
            : "Todos";


    const fecha =
        new Date()
            .toISOString()
            .slice(0,10);


    XLSX.writeFile(
        libro,
        `Cobros_Pendientes_${nombreVendedor}_${fecha}.xlsx`
    );

}

/*=========================================================
CARGAR OPCIONES DE FILTROS
=========================================================*/

function cargarOpcionesFiltros(){

    const vendedores = [
        ...new Set(
            cobros.map(cobro=>cobro.vendedor)
        )
    ].sort();

    const rutas = [
        ...new Set(
            cobros.map(cobro=>cobro.ruta)
        )
    ].sort();


    cmbVendedor.innerHTML =
        `<option value="">Todos los vendedores</option>`;

    vendedores.forEach(vendedor=>{

        cmbVendedor.innerHTML += `
            <option value="${vendedor}">
                ${vendedor}
            </option>
        `;

    });


    cmbRuta.innerHTML =
        `<option value="">Todas las rutas</option>`;

    rutas.forEach(ruta=>{

        cmbRuta.innerHTML += `
            <option value="${ruta}">
                ${ruta}
            </option>
        `;

    });

}



/*=========================================================
UTILIDADES DE FILTRO
=========================================================*/

function normalizarTexto(texto){

    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"")
        .trim();

}

/*=========================================================
ORDEN DE PRIORIDAD
=========================================================*/

function prioridadEstado(cliente){

    switch(obtenerEstado(cliente)){

        case "rojo":
            return 1;

        case "amarillo":
            return 2;

        case "verde":
            return 3;

        case "gris":
            return 4;

        default:
            return 5;

    }

}


function convertirEstadoFiltro(estado, cobro = null){

    if(
        cobro &&
        cobro.chequePosfechado === true &&
        !cobro.pagado
    ){
        return "Cheque posfechado";
    }

    switch(estado){

        case "verde":
            return "En plazo";

        case "amarillo":
            return "Próximo a vencer";

        case "rojo":
            return "Vencido";

        case "gris":
            return "Pagado";

        default:
            return "";

    }

}
cargarOpcionesFiltros();

/*=========================================================
ACCESOS RÁPIDOS DEL DASHBOARD
=========================================================*/

document.getElementById("cardPendiente")
    .addEventListener("click", () => abrirCobrosPorEstado(""));

document.getElementById("cardEnPlazo")
    .addEventListener("click", () => abrirCobrosPorEstado("En plazo"));

document.getElementById("cardProximos")
    .addEventListener("click", () => abrirCobrosPorEstado("Próximo a vencer"));

document.getElementById("cardVencidos")
    .addEventListener("click", () => abrirCobrosPorEstado("Vencido"));

document.getElementById("cardCobrado")
    .addEventListener("click", () => {

        modalHistorial.classList.remove("hidden");
        cargarVendedoresHistorial();
cargarHistorial();

    });


function abrirCobrosPorEstado(estado){

    cambiarPanel("cobros");

    txtBuscar.value = "";
    cmbVendedor.value = "";
    cmbRuta.value = "";
    cmbEstado.value = estado;

    aplicarFiltros();

}

/*=========================================================
NUEVA FACTURA
=========================================================*/

const modalNuevaFactura = document.getElementById("modalNuevaFactura");

const btnNuevaFactura = document.getElementById("btnNuevaFactura");
const btnCerrarNuevaFactura = document.getElementById("btnCerrarNuevaFactura");
const btnCancelarNuevaFactura = document.getElementById("btnCancelarNuevaFactura");

const formNuevaFactura = document.getElementById("formNuevaFactura");
const inputChequePosfechado =
    document.getElementById("inputChequePosfechado");

const grupoFechaCheque =
    document.getElementById("grupoFechaCheque");

const inputFechaCheque =
    document.getElementById("inputFechaCheque");

const grupoPlazo =
    document.getElementById("grupoPlazo");

const inputPlazo =
    document.getElementById("inputPlazo");
const buscarClienteFactura =
    document.getElementById("buscarClienteFactura");

const selectClienteFactura =
    document.getElementById("selectClienteFactura");

const sugerenciasClienteFactura =
    document.getElementById("sugerenciasClienteFactura");

inputChequePosfechado.addEventListener("change", () => {

    if(inputChequePosfechado.checked){

        grupoPlazo.style.display = "none";
        inputPlazo.required = false;
        inputPlazo.value = "";

        grupoFechaCheque.style.display = "";
        inputFechaCheque.required = true;

    }else{

        grupoPlazo.style.display = "";
        inputPlazo.required = true;

        grupoFechaCheque.style.display = "none";
        inputFechaCheque.required = false;
        inputFechaCheque.value = "";

    }

});
btnNuevaFactura.addEventListener("click", abrirNuevaFactura);

btnCerrarNuevaFactura.addEventListener("click", cerrarNuevaFactura);

btnCancelarNuevaFactura.addEventListener("click", cerrarNuevaFactura);

function cargarSelectorClientes(
    textoBusqueda = ""
){

    const texto =
        normalizarTexto(textoBusqueda);

    const clientesActivos = clientes
        .filter(cliente =>
            cliente.activo === true
        )
        .filter(cliente =>

            !texto ||

            normalizarTexto(cliente.codigo)
                .includes(texto) ||

            normalizarTexto(cliente.cliente)
                .includes(texto)

        )
        .sort((a,b) =>
            String(a.cliente)
                .localeCompare(
                    String(b.cliente),
                    "es"
                )
        );


    selectClienteFactura.innerHTML = `
        <option value="">
            Seleccione un cliente
        </option>
    `;


    clientesActivos.forEach(cliente => {

        selectClienteFactura.innerHTML += `
            <option value="${cliente.id}">
                ${cliente.codigo} - ${cliente.cliente}
            </option>
        `;

    });

}

buscarClienteFactura.addEventListener(
    "input",
    function(){

        const texto =
            buscarClienteFactura.value.trim();

        cargarSelectorClientes(texto);
        mostrarSugerenciasClientes(texto);

    }
);

function mostrarSugerenciasClientes(textoBusqueda){

    const texto =
        normalizarTexto(textoBusqueda);

    sugerenciasClienteFactura.innerHTML = "";

    if(!texto){
        sugerenciasClienteFactura.classList.add("hidden");
        return;
    }

    const coincidencias = clientes
        .filter(cliente =>
            cliente.activo === true
        )
        .filter(cliente =>
            normalizarTexto(cliente.codigo).includes(texto) ||
            normalizarTexto(cliente.cliente).includes(texto)
        )
        .slice(0, 8);


    if(coincidencias.length === 0){

        sugerenciasClienteFactura.innerHTML = `
            <div class="sugerenciaCliente vacia">
                No se encontraron clientes.
            </div>
        `;

        sugerenciasClienteFactura.classList.remove("hidden");
        return;
    }


    coincidencias.forEach(cliente => {

        const opcion = document.createElement("div");

        opcion.className = "sugerenciaCliente";

        opcion.textContent =
            `${cliente.codigo} - ${cliente.cliente}`;

        opcion.addEventListener("click", ()=>{

            seleccionarClienteFactura(cliente);

        });

        sugerenciasClienteFactura.appendChild(opcion);

    });


    sugerenciasClienteFactura.classList.remove("hidden");

}


function seleccionarClienteFactura(cliente, origen){

    if(origen === "buscador"){

        buscarClienteFactura.value =
            `${cliente.codigo} - ${cliente.cliente}`;

        cargarSelectorClientes();

        selectClienteFactura.value = "";

    }

    if(origen === "selector"){

        buscarClienteFactura.value = "";

    }


    document.getElementById("inputCodigo").value =
        cliente.codigo || "";

    document.getElementById("inputCliente").value =
        cliente.cliente || "";

    document.getElementById("inputRuta").value =
        cliente.ruta || "";

    document.getElementById("inputVendedor").value =
        cliente.vendedor || "";

    document.getElementById("inputContacto").value =
        cliente.contacto || "";

    document.getElementById("inputTelefono").value =
        cliente.telefono || "";

    document.getElementById("inputPlazo").value =
        cliente.plazo || "";

    sugerenciasClienteFactura.classList.add("hidden");

}
selectClienteFactura.addEventListener(
    "change",
    function(){

        const cliente = clientes.find(
            item =>
                item.id === selectClienteFactura.value
        );

        if(!cliente){
            limpiarDatosClienteFactura();
            return;
        }

        seleccionarClienteFactura(cliente);

    }
);

function limpiarDatosClienteFactura(){

    document.getElementById("inputCodigo").value = "";
    document.getElementById("inputCliente").value = "";
    document.getElementById("inputRuta").value = "";
    document.getElementById("inputVendedor").value = "";
    document.getElementById("inputContacto").value = "";
    document.getElementById("inputTelefono").value = "";
    document.getElementById("inputPlazo").value = "";

}

async function abrirNuevaFactura(){

    await cargarClientesFirestore();

    buscarClienteFactura.value = "";

    cargarSelectorClientes();

    selectClienteFactura.value = "";

    limpiarDatosClienteFactura();

    document.getElementById("inputFactura").value = "";
    document.getElementById("inputMonto").value = "";

    document.getElementById("inputFechaFactura").valueAsDate =
        new Date();

    document.getElementById("inputFechaEntrega").valueAsDate =
        new Date();

    modalNuevaFactura.classList.remove("hidden");

}


function cerrarNuevaFactura(){

    modalNuevaFactura.classList.add("hidden");

    formNuevaFactura.reset();

delete formNuevaFactura.dataset.modo;
delete formNuevaFactura.dataset.idFactura;

document.querySelector("#modalNuevaFactura .modalHeader h2")
    .textContent = "Nueva Factura Operativa";

document.getElementById("btnGuardarNuevaFactura")
    .textContent = "Guardar Factura";

}

/*=========================================================
GUARDAR FACTURA
=========================================================*/

formNuevaFactura.addEventListener("submit", guardarFactura);



async function guardarFactura(e){

    e.preventDefault();

    const modoEdicion =
        formNuevaFactura.dataset.modo === "editar";

    const idFacturaEditada =
        formNuevaFactura.dataset.idFactura;

    const datosFactura = {

        codigo: document.getElementById("inputCodigo").value.trim(),
        cliente: document.getElementById("inputCliente").value.trim(),
        ruta: document.getElementById("inputRuta").value.trim(),
        vendedor: document.getElementById("inputVendedor").value.trim(),
        contacto: document.getElementById("inputContacto").value.trim(),
        telefono: document.getElementById("inputTelefono").value.trim(),
        factura: document.getElementById("inputFactura").value.trim(),
        monto: Number(document.getElementById("inputMonto").value),
        fechaFactura: document.getElementById("inputFechaFactura").value,
entrega: document.getElementById("inputFechaEntrega").value,

chequePosfechado:
    document.getElementById("inputChequePosfechado").checked,

fechaCheque:
    document.getElementById("inputChequePosfechado").checked
        ? document.getElementById("inputFechaCheque").value
        : "",

plazo:
    document.getElementById("inputChequePosfechado").checked
        ? 0
        : Number(document.getElementById("inputPlazo").value),
        notas: "",
        pagado: false,
        estado: "activa",
        actualizadoPor: usuarioActual.correo,
        fechaActualizacion: new Date().toISOString()

    };
const numeroFactura =
    datosFactura.factura.toUpperCase();

datosFactura.factura = numeroFactura;

const consultaDuplicado = query(
    collection(db, "facturas"),
    where("factura", "==", numeroFactura),
    limit(1)
);

const resultadoDuplicado =
    await getDocs(consultaDuplicado);

const existeDuplicado =
    resultadoDuplicado.docs.some(documento =>
        documento.id !== idFacturaEditada
    );

if(existeDuplicado){

    alert("Ese número de factura ya está registrado.");
    return;

}
    try{

        if(modoEdicion){

    const facturaAnterior = cobros.find(
        item => item.id === idFacturaEditada
    );

    await updateDoc(
        doc(db, "facturas", idFacturaEditada),
        datosFactura
    );

    await registrarAuditoria(

        "FACTURA EDITADA",

        {
            id: idFacturaEditada,
            ...datosFactura
        },

        `Valores anteriores: cliente=${facturaAnterior?.cliente || ""}, ` +
        `monto=B/. ${Number(facturaAnterior?.monto || 0).toFixed(2)}, ` +
        `plazo=${facturaAnterior?.plazo || 0} días.`

    );

}else{

    datosFactura.creadoPor = usuarioActual.correo;
    datosFactura.fechaCreacion = new Date().toISOString();

    const referenciaNueva = await addDoc(
        collection(db, "facturas"),
        datosFactura
    );

    await registrarAuditoria(

        "FACTURA CREADA",

        {
            id: referenciaNueva.id,
            ...datosFactura
        },

       datosFactura.chequePosfechado
    ? `Monto: B/. ${datosFactura.monto.toFixed(2)}. ` +
      `Cheque posfechado. Fecha del cheque: ${datosFactura.fechaCheque}.`
    : `Monto: B/. ${datosFactura.monto.toFixed(2)}. ` +
      `Plazo: ${datosFactura.plazo} días.`

    );

}

        await cargarCobrosFirestore();
        cerrarNuevaFactura();

    }
catch(error){

    console.error(error);

    alert(
        error.code + "\n\n" +
        error.message
    );

}
}

async function cargarCobrosFirestore(){

    try{

        const resultado = await getDocs(
            collection(db, "facturas")
        );

        cobros = resultado.docs
            .map(documento => ({

                id: documento.id,
                ...documento.data()

            }))
            .filter(factura =>
                factura.estado !== "anulada" &&
                factura.pagado !== true
            );

        cargarCobros();
        
        cargarOpcionesFiltros();
        actualizarDashboard();

    }catch(error){

        console.error("Error cargando facturas:", error);

    }

}

/*=========================================================
USUARIO Y PERMISOS
=========================================================*/






function nombreVisibleRol(rol){

    switch(rol){

        case "consulta":
            return "Solo consulta";

        case "operador":
            return "Consulta y alimentación";

        case "administrador":
            return "Administrador";

        default:
            return rol;

    }

}


function puedeAlimentar(){

    return (
        usuarioActual?.rol === "operador" ||
        usuarioActual?.rol === "administrador"
    );

}


function puedeAdministrar(){

    return usuarioActual?.rol === "administrador";

}


function aplicarPermisos(){

    if(!usuarioActual){
        return;
    }

    const permiteAlimentar = puedeAlimentar();
    const permiteAdministrar = puedeAdministrar();

    btnNuevaFactura.classList.toggle(
        "hidden",
        !permiteAlimentar
    );

    document.querySelectorAll(".checkPagado")
        .forEach(check => {

            check.disabled = !permiteAlimentar;

        });

    document.querySelectorAll(".btnEditarFactura")
        .forEach(boton => {

            boton.classList.toggle(
                "hidden",
                !permiteAdministrar
            );

        });

    document.querySelectorAll(".btnAnularFactura")
        .forEach(boton => {

            boton.classList.toggle(
                "hidden",
                !permiteAdministrar
            );

        });

    txtNotas.readOnly = !permiteAlimentar;

    btnGuardarNotas.classList.toggle(
        "hidden",
        !permiteAlimentar
    );

}





/*=========================================================
LOGIN LOCAL TEMPORAL
=========================================================*/

const loginScreen = document.getElementById("loginScreen");
const formLogin = document.getElementById("formLogin");
const loginCorreo = document.getElementById("loginCorreo");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");


formLogin.addEventListener("submit", async function(event){

    event.preventDefault();

    const correo = loginCorreo.value.trim().toLowerCase();
    const password = loginPassword.value;

    loginError.classList.add("hidden");

    try{

        await signInWithEmailAndPassword(
            auth,
            correo,
            password
        );

    }catch(error){

        console.error(error);

        loginError.textContent =
            "Correo o contraseña incorrectos.";

        loginError.classList.remove("hidden");

    }

});


/*=========================================================
EDITAR Y ANULAR FACTURA
=========================================================*/

document.addEventListener("click", function(event){
const botonNotas = event.target.closest(".btnNotas");

if(botonNotas){

    abrirNotas(botonNotas.dataset.id);

}
const btnEditar =
    event.target.closest(".btnEditarCliente");
    const botonEditar = event.target.closest(".btnEditarFactura");
    const botonAnular = event.target.closest(".btnAnularFactura");

    if(botonEditar){

        editarFactura(botonEditar.dataset.id);

    }

    if(botonAnular){

        solicitarAnulacionFactura(botonAnular.dataset.id);

    }

});


function editarFactura(idFactura){

    if(!puedeAdministrar()){
        return;
    }

    const factura = cobros.find(item => item.id === idFactura);

    if(!factura){
        return;
    }

    document.getElementById("inputCodigo").value = factura.codigo;
    document.getElementById("inputCliente").value = factura.cliente;
    document.getElementById("inputRuta").value = factura.ruta;
    document.getElementById("inputVendedor").value = factura.vendedor;
    document.getElementById("inputContacto").value = factura.contacto || "";
    document.getElementById("inputTelefono").value = factura.telefono || "";
    document.getElementById("inputFactura").value = factura.factura;
    document.getElementById("inputMonto").value = factura.monto;
    document.getElementById("inputFechaFactura").value = factura.fechaFactura || "";
    document.getElementById("inputFechaEntrega").value = factura.entrega;
   const esChequePosfechado =
    factura.chequePosfechado === true;

inputChequePosfechado.checked =
    esChequePosfechado;

if(esChequePosfechado){

    grupoPlazo.style.display = "none";

    inputPlazo.required = false;
    inputPlazo.value = "";

    grupoFechaCheque.style.display = "";

    inputFechaCheque.required = true;
    inputFechaCheque.value =
        factura.fechaCheque || "";

}else{

    grupoPlazo.style.display = "";

    inputPlazo.required = true;
    inputPlazo.value =
        factura.plazo || "";

    grupoFechaCheque.style.display = "none";

    inputFechaCheque.required = false;
    inputFechaCheque.value = "";

}

    formNuevaFactura.dataset.modo = "editar";
    formNuevaFactura.dataset.idFactura = idFactura;

    document.querySelector("#modalNuevaFactura .modalHeader h2")
        .textContent = "Editar Factura Operativa";

    document.getElementById("btnGuardarNuevaFactura")
        .textContent = "Guardar Cambios";

    modalNuevaFactura.classList.remove("hidden");

}


function solicitarAnulacionFactura(idFactura){

    if(!puedeAdministrar()){
        return;
    }

    const factura = cobros.find(item => item.id === idFactura);

    if(!factura){
        return;
    }

    accionPendiente = "ANULAR";
    modalConfirmacion.dataset.idFactura = idFactura;

    lblConfirmacion.textContent =
        `¿Confirma que desea anular la factura ${factura.factura}?`;

    modalConfirmacion.classList.remove("hidden");

}
/*=========================================================
AUDITORÍA
=========================================================*/

const modalAuditoria =
    document.getElementById("modalAuditoria");

const btnCerrarAuditoria =
    document.getElementById("btnCerrarAuditoria");

const tbodyAuditoria =
    document.getElementById("tbodyAuditoria");

const txtBuscarAuditoria =
    document.getElementById("txtBuscarAuditoria");

let eventosAuditoria = [];


async function registrarAuditoria(
    accion,
    factura = {},
    detalle = ""
){

    try{

        await addDoc(
            collection(db, "auditoria"),
            {
                accion,
                facturaId: factura.id || "",
                factura: factura.factura || "",
                cliente: factura.cliente || "",
                codigoCliente: factura.codigo || "",
                detalle,
                usuario:
                    usuarioActual?.correo || "desconocido",
                rol:
                    usuarioActual?.rol || "desconocido",
                fecha:
                    new Date().toISOString()
            }
        );

    }catch(error){

        console.error(
            "Error registrando auditoría:",
            error
        );

    }

}

async function registrarAuditoriaClienteEdicion(
    anterior,
    nuevo
){

    try{

        await addDoc(
            collection(db, "auditoria"),
            {
                accion: "CLIENTE EDITADO",

                clienteId:
                    nuevo.id || "",

                cliente:
                    nuevo.cliente || "",

                codigoCliente:
                    nuevo.codigo || "",

                detalle:
                    `Antes: ` +
                    `cliente=${anterior?.cliente || ""}, ` +
                    `vendedor=${anterior?.vendedor || ""}, ` +
                    `ruta=${anterior?.ruta || ""}, ` +
                    `plazo=${anterior?.plazo || ""}, ` +
                    `contacto=${anterior?.contacto || ""}, ` +
                    `telefono=${anterior?.telefono || ""}, ` +
                    `direccion=${anterior?.direccion || ""}, ` +
                    `operador=${anterior?.operador || ""}. ` +
                    `Después: ` +
                    `cliente=${nuevo.cliente || ""}, ` +
                    `vendedor=${nuevo.vendedor || ""}, ` +
                    `ruta=${nuevo.ruta || ""}, ` +
                    `plazo=${nuevo.plazo || ""}, ` +
                    `contacto=${nuevo.contacto || ""}, ` +
                    `telefono=${nuevo.telefono || ""}, ` +
                    `direccion=${nuevo.direccion || ""}, ` +
                    `operador=${nuevo.operador || ""}.`,

                usuario:
                    usuarioActual?.correo || "desconocido",

                rol:
                    usuarioActual?.rol || "desconocido",

                fecha:
                    new Date().toISOString()
            }
        );

    }catch(error){

        console.error(
            "Error registrando edición del cliente:",
            error
        );

    }

}
async function cargarAuditoriaFirestore(){

    try{

        const resultado = await getDocs(
            collection(db, "auditoria")
        );

        eventosAuditoria = resultado.docs
            .map(documento => ({
                id: documento.id,
                ...documento.data()
            }))
            .sort((a,b) =>
                new Date(b.fecha) -
                new Date(a.fecha)
            );

        mostrarAuditoria(eventosAuditoria);

    }catch(error){

        console.error(
            "Error cargando auditoría:",
            error
        );

    }

}


function mostrarAuditoria(lista){

    tbodyAuditoria.innerHTML = "";

    if(lista.length === 0){

        tbodyAuditoria.innerHTML = `

            <tr>

                <td colspan="6">
                    No hay eventos registrados.
                </td>

            </tr>

        `;

        return;

    }

    lista.forEach(evento => {

        tbodyAuditoria.innerHTML += `

            <tr>

                <td>
                    ${new Date(evento.fecha)
                        .toLocaleString("es-PA")}
                </td>

                <td>
                    ${evento.accion || ""}
                </td>

                <td>
                    ${evento.factura || ""}
                </td>

                <td>
                    ${evento.cliente || ""}
                </td>

                <td class="auditoriaDetalle">
                    ${evento.detalle || ""}
                </td>

                <td>
                    ${evento.usuario || ""}
                </td>

            </tr>

        `;

    });

}


async function abrirAuditoria(){

    await cargarAuditoriaFirestore();

    modalAuditoria.classList.remove("hidden");

}


btnCerrarAuditoria.addEventListener("click", ()=>{

    modalAuditoria.classList.add("hidden");

});


txtBuscarAuditoria.addEventListener("input", ()=>{

    const texto =
        normalizarTexto(txtBuscarAuditoria.value);

    const resultado = eventosAuditoria.filter(evento =>

        normalizarTexto(evento.accion).includes(texto) ||
        normalizarTexto(evento.factura).includes(texto) ||
        normalizarTexto(evento.cliente).includes(texto) ||
        normalizarTexto(evento.usuario).includes(texto) ||
        normalizarTexto(evento.detalle).includes(texto)

    );

    mostrarAuditoria(resultado);

});

/*=========================================================
CLIENTES
=========================================================*/

const modalClientes =
    document.getElementById("modalClientes");

const btnCerrarClientes =
    document.getElementById("btnCerrarClientes");

const btnNuevoCliente =
    document.getElementById("btnNuevoCliente");

const btnImportarClientes =
    document.getElementById("btnImportarClientes");

const archivoClientesExcel =
    document.getElementById("archivoClientesExcel");

const modalNuevoCliente =
    document.getElementById("modalNuevoCliente");

const btnCerrarNuevoCliente =
    document.getElementById("btnCerrarNuevoCliente");

const btnCancelarNuevoCliente =
    document.getElementById("btnCancelarNuevoCliente");

const formNuevoCliente =
    document.getElementById("formNuevoCliente");

let clientes = [];

const tbodyClientes =
    document.getElementById("tbodyClientes");

const txtBuscarClientes =
    document.getElementById("txtBuscarClientes");

const cmbEstadoCliente =
    document.getElementById("cmbEstadoCliente");


btnNuevoCliente.addEventListener("click", ()=>{

    if(!puedeAdministrar()){
        return;
    }

    formNuevoCliente.reset();

    modalNuevoCliente.classList.remove("hidden");

});


btnCerrarNuevoCliente.addEventListener("click", cerrarNuevoCliente);

btnCancelarNuevoCliente.addEventListener("click", cerrarNuevoCliente);

document.addEventListener("click", async function(event){

    const btnEditar =
        event.target.closest(".btnEditarCliente");

    const btnInactivar =
        event.target.closest(".btnInactivarCliente");

    const btnReactivar =
        event.target.closest(".btnReactivarCliente");


    if(btnEditar){

        abrirEditarCliente(
            btnEditar.dataset.id
        );

    }


    if(btnInactivar){

        await cambiarEstadoCliente(
            btnInactivar.dataset.id,
            false
        );

    }


    if(btnReactivar){

        await cambiarEstadoCliente(
            btnReactivar.dataset.id,
            true
        );

    }

});

function abrirEditarCliente(idCliente){

    if(!puedeAdministrar()){
        return;
    }

    const cliente = clientes.find(
        item => item.id === idCliente
    );

    if(!cliente){
        return;
    }

    document.getElementById("clienteCodigo").value =
        cliente.codigo || "";

    document.getElementById("clienteNombre").value =
        cliente.cliente || "";

    document.getElementById("clienteVendedor").value =
        cliente.vendedor || "";

    document.getElementById("clienteRuta").value =
        cliente.ruta || "";

    document.getElementById("clientePlazo").value =
        cliente.plazo || "";

    document.getElementById("clienteContacto").value =
        cliente.contacto || "";

    document.getElementById("clienteTelefono").value =
        cliente.telefono || "";

    document.getElementById("clienteDireccion").value =
        cliente.direccion || "";

    document.getElementById("clienteOperador").value =
        cliente.operador || "";

    formNuevoCliente.dataset.modo = "editar";
    formNuevoCliente.dataset.idCliente = idCliente;

    document.querySelector(
        "#modalNuevoCliente .modalHeader h2"
    ).textContent = "Editar Cliente";

    document.getElementById("btnGuardarNuevoCliente")
        .textContent = "Guardar Cambios";

    modalNuevoCliente.classList.remove("hidden");

}


async function cambiarEstadoCliente(
    idCliente,
    nuevoEstado
){

    if(!puedeAdministrar()){
        return;
    }

    const cliente = clientes.find(
        item => item.id === idCliente
    );

    if(!cliente){
        return;
    }

    const accion =
        nuevoEstado
            ? "reactivar"
            : "inactivar";

    const confirmar = confirm(
        `¿Confirma que desea ${accion} al cliente ${cliente.cliente}?`
    );

    if(!confirmar){
        return;
    }

    try{

        await updateDoc(
            doc(db, "clientes", idCliente),
            {
                activo: nuevoEstado,
                fechaActualizacion:
                    new Date().toISOString(),
                actualizadoPor:
                    usuarioActual.correo
            }
        );

        await registrarAuditoriaCliente(
            nuevoEstado
                ? "CLIENTE REACTIVADO"
                : "CLIENTE INACTIVADO",
            cliente
        );

        await cargarClientesFirestore();

    }catch(error){

        console.error(
            "Error actualizando estado del cliente:",
            error
        );

        alert(
            "No se pudo actualizar el estado del cliente."
        );

    }

}

async function registrarAuditoriaCliente(
    accion,
    cliente
){

    try{

        await addDoc(
            collection(db, "auditoria"),
            {
                accion,

                clienteId:
                    cliente.id || "",

                cliente:
                    cliente.cliente || "",

                codigoCliente:
                    cliente.codigo || "",

                detalle:
                    `Cliente ${cliente.codigo || ""} - ${cliente.cliente || ""}`,

                usuario:
                    usuarioActual?.correo || "desconocido",

                rol:
                    usuarioActual?.rol || "desconocido",

                fecha:
                    new Date().toISOString()
            }
        );

    }catch(error){

        console.error(
            "Error registrando auditoría del cliente:",
            error
        );

    }

}


async function cargarClientesFirestore(){

    try{

        const resultado = await getDocs(
            collection(db, "clientes")
        );

        clientes = resultado.docs.map(documento => ({
            id: documento.id,
            ...documento.data()
        }));

        mostrarClientes();

    }catch(error){

        console.error(
            "Error cargando clientes:",
            error
        );

    }

}
function mostrarClientes(){

    const texto =
        normalizarTexto(txtBuscarClientes.value);

    const estado =
        cmbEstadoCliente.value;

    const lista = clientes.filter(cliente => {

        const coincideTexto =
            !texto ||
            normalizarTexto(cliente.codigo).includes(texto) ||
            normalizarTexto(cliente.cliente).includes(texto) ||
            normalizarTexto(cliente.vendedor).includes(texto) ||
            normalizarTexto(cliente.ruta).includes(texto) ||
            normalizarTexto(cliente.direccion).includes(texto) ||
            normalizarTexto(cliente.operador).includes(texto);

        const coincideEstado =
            estado === "todos" ||
            (
                estado === "activos" &&
                cliente.activo === true
            ) ||
            (
                estado === "inactivos" &&
                cliente.activo === false
            );

        return coincideTexto && coincideEstado;

    });


    tbodyClientes.innerHTML = "";


    if(lista.length === 0){

        tbodyClientes.innerHTML = `
            <tr>
                <td colspan="11">
                    No hay clientes para mostrar.
                </td>
            </tr>
        `;

        return;

    }


    lista.forEach(cliente => {

        tbodyClientes.innerHTML += `
            <tr>

                <td>${cliente.codigo || ""}</td>

                <td>${cliente.cliente || ""}</td>

                <td>${cliente.vendedor || ""}</td>

                <td>${cliente.ruta || ""}</td>

                <td>${cliente.plazo || ""} días</td>

                <td>${cliente.contacto || ""}</td>

                <td>${cliente.telefono || ""}</td>

                <td>${cliente.direccion || ""}</td>

                <td>${cliente.operador || ""}</td>

                <td>
                    ${cliente.activo
                        ? "Activo"
                        : "Inactivo"}
                </td>

                <td>

    <button
        type="button"
        class="btnEditarCliente"
        data-id="${cliente.id}">
        Editar
    </button>

    ${cliente.activo
        ? `<button
            type="button"
            class="btnInactivarCliente"
            data-id="${cliente.id}">
            Inactivar
           </button>`
        : `<button
            type="button"
            class="btnReactivarCliente"
            data-id="${cliente.id}">
            Reactivar
           </button>`
    }

</td>

            </tr>
        `;

    });

}

function cerrarNuevoCliente(){

    modalNuevoCliente.classList.add("hidden");

    formNuevoCliente.reset();

    delete formNuevoCliente.dataset.modo;
    delete formNuevoCliente.dataset.idCliente;

    document.querySelector(
        "#modalNuevoCliente .modalHeader h2"
    ).textContent = "Nuevo Cliente";

    document.getElementById("btnGuardarNuevoCliente")
        .textContent = "Guardar Cliente";

}


formNuevoCliente.addEventListener(
    "submit",
    guardarNuevoCliente
);


async function guardarNuevoCliente(event){

    event.preventDefault();

    if(!puedeAdministrar()){
        return;
    }
const modoEdicion =
    formNuevoCliente.dataset.modo === "editar";

const idClienteEditado =
    formNuevoCliente.dataset.idCliente;
    const codigo =
        document.getElementById("clienteCodigo")
            .value
            .trim()
            .toUpperCase();

    const cliente =
        document.getElementById("clienteNombre")
            .value
            .trim();

    const vendedor =
        document.getElementById("clienteVendedor")
            .value
            .trim();

    const ruta =
        document.getElementById("clienteRuta")
            .value
            .trim();

    const plazo =
        Number(
            document.getElementById("clientePlazo").value
        );

    const contacto =
        document.getElementById("clienteContacto")
            .value
            .trim();

    const telefono =
        document.getElementById("clienteTelefono")
            .value
            .trim();

    const direccion =
        document.getElementById("clienteDireccion")
            .value
            .trim();

    const operador =
        document.getElementById("clienteOperador")
            .value
            .trim();


    if(!codigo || !cliente || !vendedor || !ruta || !plazo || !operador){

        alert("Complete todos los campos obligatorios.");

        return;

    }


    try{

        const consultaCodigo = query(

    collection(db, "clientes"),

    where("codigo", "==", codigo),

    limit(10)

);


const resultadoCodigo =
    await getDocs(consultaCodigo);


const existeDuplicado =
    resultadoCodigo.docs.some(
        documento =>
            documento.id !== idClienteEditado
    );


if(existeDuplicado){

    alert(
        "Ya existe un cliente registrado con ese código."
    );

    return;

}


        if(modoEdicion){

    const clienteAnterior = clientes.find(
        item => item.id === idClienteEditado
    );

    await updateDoc(
        doc(db, "clientes", idClienteEditado),
        {
            codigo,
            cliente,
            vendedor,
            ruta,
            plazo,
            contacto,
            telefono,
            direccion,
            operador,

            fechaActualizacion:
                new Date().toISOString(),

            actualizadoPor:
                usuarioActual.correo
        }
    );

    await registrarAuditoriaClienteEdicion(
        clienteAnterior,
        {
            id: idClienteEditado,
            codigo,
            cliente,
            vendedor,
            ruta,
            plazo,
            contacto,
            telefono,
            direccion,
            operador
        }
    );

}else{

    await addDoc(

        collection(db, "clientes"),

        {
            codigo,
            cliente,
            vendedor,
            ruta,
            plazo,
            contacto,
            telefono,
            direccion,
            operador,

            activo: true,

            origen: "manual",

            fechaCreacion:
                new Date().toISOString(),

            creadoPor:
                usuarioActual.correo
        }

    );

}


        alert(
    modoEdicion
        ? "Cliente actualizado correctamente."
        : "Cliente creado correctamente."
);

        await cargarClientesFirestore();

        cerrarNuevoCliente();


    }catch(error){

        console.error(
            "Error creando cliente:",
            error
        );

        alert(
            "No se pudo crear el cliente."
        );

    }

}

txtBuscarClientes.addEventListener(
    "input",
    mostrarClientes
);

cmbEstadoCliente.addEventListener(
    "change",
    mostrarClientes
);

async function abrirClientes(){

    await cargarClientesFirestore();

    modalClientes.classList.remove("hidden");

}


btnCerrarClientes.addEventListener("click", ()=>{

    modalClientes.classList.add("hidden");

});


btnImportarClientes.addEventListener("click", ()=>{

    archivoClientesExcel.click();

});

archivoClientesExcel.addEventListener(
    "change",
    importarClientesExcel
);


async function importarClientesExcel(event){

    if(!puedeAdministrar()){
        return;
    }

    const archivo = event.target.files[0];

    if(!archivo){
        return;
    }

    try{

        const datos =
            await archivo.arrayBuffer();

        const libro =
            XLSX.read(datos);

        const primeraHoja =
            libro.SheetNames[0];

        const hoja =
            libro.Sheets[primeraHoja];

        const filas =
            XLSX.utils.sheet_to_json(
                hoja,
                {
                    defval: "",
                    raw: false
                }
            );


        if(filas.length === 0){

            alert("El archivo no contiene clientes.");

            archivoClientesExcel.value = "";

            return;

        }


        const resultadoActual =
            await getDocs(
                collection(db, "clientes")
            );

        const codigosExistentes =
            new Set(
                resultadoActual.docs.map(
                    documento =>
                        String(
                            documento.data().codigo || ""
                        )
                        .trim()
                        .toUpperCase()
                )
            );


        let creados = 0;
        let duplicados = 0;
        let errores = 0;


        for(const fila of filas){

            const codigo =
                String(
                    fila["Código"] || ""
                )
                .trim()
                .toUpperCase();

            const cliente =
                String(
                    fila["Cliente"] || ""
                )
                .trim();

            const vendedor =
                String(
                    fila["Vendedor"] || ""
                )
                .trim();

            const ruta =
                String(
                    fila["Ruta"] || ""
                )
                .trim();

            const plazo =
                Number(
                    String(
                        fila["Plazo"] || ""
                    )
                    .trim()
                );

            const contacto =
                String(
                    fila["Contacto"] || ""
                )
                .trim();

            const telefono =
                String(
                    fila["Teléfono"] || ""
                )
                .trim();

            const direccion =
                String(
                    fila["Dirección"] || ""
                )
                .trim();

            const operador =
                String(
                    fila["Operador"] || ""
                )
                .trim();


            if(
                !codigo ||
                !cliente ||
                !vendedor ||
                !ruta ||
                !plazo ||
                !operador
            ){

                errores++;
                continue;

            }


            if(
                codigosExistentes.has(codigo)
            ){

                duplicados++;
                continue;

            }


            await addDoc(
                collection(db, "clientes"),
                {
                    codigo,
                    cliente,
                    vendedor,
                    ruta,
                    plazo,
                    contacto,
                    telefono,
                    direccion,
                    operador,

                    activo: true,

                    origen: "excel",

                    fechaCreacion:
                        new Date().toISOString(),

                    creadoPor:
                        usuarioActual.correo
                }
            );


            codigosExistentes.add(codigo);

            creados++;

        }


        await cargarClientesFirestore();


        alert(
            "Importación finalizada.\n\n" +
            `Clientes creados: ${creados}\n` +
            `Duplicados omitidos: ${duplicados}\n` +
            `Filas con errores: ${errores}`
        );


    }catch(error){

        console.error(
            "Error importando clientes:",
            error
        );

        alert(
            "No se pudo importar el archivo Excel."
        );

    }


    archivoClientesExcel.value = "";

}
/*=========================================================
CONFIGURACIÓN
=========================================================*/

const botonesConfig = document.querySelectorAll(".configButton");

botonesConfig.forEach(boton => {

    boton.addEventListener("click", function(){

        const opcion = boton.textContent.trim();

        abrirOpcionConfiguracion(opcion);

    });

});


function abrirOpcionConfiguracion(opcion){

    switch(opcion){

        case "Usuarios":
            mostrarMensajeConfiguracion(
                "Usuarios",
                "Aquí se administrarán los usuarios autorizados y sus permisos."
            );
            break;

case "Clientes":

    abrirClientes();

    break;

        case "Firebase":
            mostrarMensajeConfiguracion(
                "Firebase",
                "Este módulo se utilizará para conectar Authentication y Firestore."
            );
            break;

        case "Auditoría":

    abrirAuditoria();

    break;

        case "Acerca de":
            mostrarMensajeConfiguracion(
                "Acerca de",
                "Control de Cobros Operativos - v0.1.0 Alpha"
            );
            break;

        default:
            mostrarMensajeConfiguracion(
                opcion,
                "Este módulo todavía está pendiente de desarrollo."
            );

    }

}


function mostrarMensajeConfiguracion(titulo, mensaje){

    lblConfirmacion.textContent = mensaje;

    document.querySelector(
        "#modalConfirmacion .modalHeader h2"
    ).textContent = titulo;

    btnAceptar.classList.add("hidden");

    btnCancelar.textContent = "Cerrar";

    accionPendiente = "CERRAR_CONFIG";

    modalConfirmacion.classList.remove("hidden");

}
btnCancelar.addEventListener("click", function(){

    modalConfirmacion.classList.add("hidden");

    btnAceptar.classList.remove("hidden");
    btnCancelar.textContent = "Cancelar";

    document.querySelector(
        "#modalConfirmacion .modalHeader h2"
    ).textContent = "Confirmación";

    lblConfirmacion.textContent = "";
    accionPendiente = "";

});
/*=========================================================
SESIÓN FIREBASE
=========================================================*/

onAuthStateChanged(auth, async function(usuarioFirebase){

    if(!usuarioFirebase){

        usuarioActual = null;

        app.classList.add("hidden");
        loginScreen.classList.remove("hidden");

        return;

    }

   const correo = usuarioFirebase.email.toLowerCase();

const referenciaUsuario = doc(
    db,
    "usuarios",
    usuarioFirebase.uid
);

const documentoUsuario = await getDoc(
    referenciaUsuario
);

if(!documentoUsuario.exists()){

    await signOut(auth);

    loginError.textContent =
        "Este usuario no tiene permisos asignados.";

    loginError.classList.remove("hidden");

    return;

}

const datosUsuario = documentoUsuario.data();

if(datosUsuario.activo !== true){

    await signOut(auth);

    loginError.textContent =
        "Este usuario está desactivado.";

    loginError.classList.remove("hidden");

    return;

}

    usuarioActual = {
        uid: usuarioFirebase.uid,
        correo,
        ...datosUsuario
    };

    document.getElementById("nombreUsuario").textContent =
        usuarioActual.nombre;

    document.getElementById("rolUsuario").textContent =
        nombreVisibleRol(usuarioActual.rol);

    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");

    await cargarCobrosFirestore();
aplicarPermisos();
});