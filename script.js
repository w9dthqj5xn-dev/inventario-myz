// Array para almacenar los equipos
let equipos = [];

// Función para mostrar sección
function mostrarSeccion(seccion) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion-content').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Remover active de todos los nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    const seccionElement = document.getElementById(`seccion-${seccion}`);
    if (seccionElement) {
        seccionElement.classList.add('active');
    }
    
    // Marcar el nav item como activo
    event.target.closest('.nav-item')?.classList.add('active');
    
    // Actualizar título
    const titulos = {
        'inventario': '📦 Inventario de Equipos',
        'agregar': '➕ Agregar Nuevo Equipo',
        'ventas': '💰 Gestión de Ventas',
        'financiamiento': '💳 Ventas Financiadas',
        'reportes': '📊 Reportes y Análisis',
        'gestion': '⚙️ Gestión de Datos'
    };
    
    const tituloElement = document.getElementById('seccionTitulo');
    if (tituloElement) {
        tituloElement.textContent = titulos[seccion] || 'Sistema M&Z';
    }
    
    // Actualizar lista de financiados si estamos en esa sección
    if (seccion === 'financiamiento') {
        actualizarListaFinanciados();
    }
}

// Cargar equipos del localStorage al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando aplicación...');
    
    // Limpiar filtros al cargar
    document.getElementById('searchInput').value = '';
    document.getElementById('filterTipo').value = '';
    
    // Cargar equipos desde Firebase (esperar a que termine)
    await cargarEquipos();
    
    // Cargar última exportación
    cargarUltimaExportacion();
    
    console.log('✅ Aplicación lista. Total equipos:', equipos.length);
});

// Formulario de registro
document.getElementById('equipoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    agregarEquipo();
});

// Búsqueda en tiempo real
document.getElementById('searchInput').addEventListener('input', filtrarEquipos);
document.getElementById('filterTipo').addEventListener('change', filtrarEquipos);

// Limpiar filtros
document.getElementById('btnLimpiar').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterTipo').value = '';
    filtrarEquipos();
});

// Función para agregar equipo
async function agregarEquipo() {
    const tipo = document.getElementById('tipo').value;
    const marca = document.getElementById('marca').value.trim();
    const modelo = document.getElementById('modelo').value.trim();
    const imei = document.getElementById('imei').value.trim();
    const suplidor = document.getElementById('suplidor').value.trim();
    const precioCompra = parseFloat(document.getElementById('precioCompra').value);

    // Validar IMEI único
    if (equipos.some(eq => eq.imei === imei)) {
        alert('⚠️ Este IMEI ya está registrado en el sistema');
        return;
    }

    // Validar IMEI (debe contener solo números y tener al menos 10 dígitos)
    if (imei.length < 10 || !/^\d+$/.test(imei)) {
        alert('⚠️ El IMEI debe contener al menos 10 dígitos numéricos');
        return;
    }

    // Crear objeto equipo
    const equipo = {
        id: Date.now(),
        tipo,
        marca,
        modelo,
        imei,
        suplidor,
        precioCompra,
        estado: 'En Inventario',
        precioVenta: null,
        ganancia: null,
        fechaVenta: null,
        fecha: new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    };

    // Agregar al array
    equipos.push(equipo);
    
    // Guardar en Firebase y localStorage
    await guardarEquipoFirebase(equipo);
    
    // Limpiar filtros para mostrar el nuevo equipo
    document.getElementById('searchInput').value = '';
    document.getElementById('filterTipo').value = '';
    
    // Actualizar tabla
    actualizarTabla();
    
    // Limpiar formulario
    document.getElementById('equipoForm').reset();
    
    // Notificación
    alert('✅ Equipo registrado exitosamente');
}

// Función para eliminar equipo
async function eliminarEquipo(id) {
    if (confirm('¿Estás seguro de eliminar este equipo?')) {
        const equipo = equipos.find(eq => eq.id === id);
        if (equipo && equipo.firebaseId) {
            await eliminarEquipoFirebase(equipo.firebaseId);
        }
        equipos = equipos.filter(eq => eq.id !== id);
        guardarEquipos();
        actualizarTabla();
        alert('🗑️ Equipo eliminado');
    }
}

// Función para vender equipo
async function venderEquipo(id) {
    const equipo = equipos.find(eq => eq.id === id);
    if (!equipo) return;

    const precioVenta = prompt(
        `🛒 VENDER EQUIPO\n\n` +
        `${equipo.marca} ${equipo.modelo}\n` +
        `IMEI: ${equipo.imei}\n\n` +
        `💵 Precio de Compra: RD$ ${equipo.precioCompra.toLocaleString('es-DO', {minimumFractionDigits: 2})}\n\n` +
        `Ingrese el precio de venta (RD$):`
    );

    if (precioVenta === null) return; // Cancelado

    const precioVentaNum = parseFloat(precioVenta);
    
    if (isNaN(precioVentaNum) || precioVentaNum <= 0) {
        alert('⚠️ Precio de venta inválido');
        return;
    }

    const ganancia = precioVentaNum - equipo.precioCompra;
    const porcentajeGanancia = ((ganancia / equipo.precioCompra) * 100).toFixed(2);

    // Actualizar equipo
    equipo.estado = 'Vendido';
    equipo.precioVenta = precioVentaNum;
    equipo.ganancia = ganancia;
    equipo.fechaVenta = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    await guardarEquipoFirebase(equipo);
    actualizarTabla();

    const gananciaTexto = ganancia >= 0 ? 
        `✅ GANANCIA: RD$ ${ganancia.toLocaleString('es-DO', {minimumFractionDigits: 2})} (+${porcentajeGanancia}%)` :
        `❌ PÉRDIDA: RD$ ${Math.abs(ganancia).toLocaleString('es-DO', {minimumFractionDigits: 2})} (${porcentajeGanancia}%)`;

    alert(
        `🎉 ¡VENTA REGISTRADA!\n\n` +
        `${equipo.marca} ${equipo.modelo}\n\n` +
        `💵 Precio de Compra: RD$ ${equipo.precioCompra.toLocaleString('es-DO', {minimumFractionDigits: 2})}\n` +
        `💰 Precio de Venta: RD$ ${precioVentaNum.toLocaleString('es-DO', {minimumFractionDigits: 2})}\n\n` +
        gananciaTexto
    );
}

// ============= VENTAS FINANCIADAS =============

function mostrarVentasFinanciadas() {
    const equiposInventario = equipos.filter(eq => eq.estado === 'En Inventario');
    
    if (equiposInventario.length === 0) {
        alert('⚠️ No hay equipos disponibles en inventario para vender');
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'modalVentaFinanciada';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="cerrarModalVentaFinanciada()">
            <div class="modal-content modal-financiado" onclick="event.stopPropagation()">
                <h2>💳 Venta Financiada</h2>
                <p>Selecciona un equipo y configura el plan de financiamiento</p>
                
                <div class="form-financiado">
                    <div class="form-group">
                        <label>Seleccionar Equipo:</label>
                        <select id="equipoFinanciado" onchange="actualizarInfoEquipo()">
                            <option value="">-- Seleccionar Equipo --</option>
                            ${equiposInventario.map(eq => `
                                <option value="${eq.id}">
                                    ${eq.marca} ${eq.modelo} - ${eq.imei} (RD$ ${eq.precioCompra.toLocaleString('es-DO')})
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div id="infoEquipoSeleccionado" style="display: none;" class="info-equipo">
                        <h3>Información del Equipo</h3>
                        <p><strong>Marca/Modelo:</strong> <span id="infoMarcaModelo"></span></p>
                        <p><strong>IMEI:</strong> <span id="infoIMEI"></span></p>
                        <p><strong>Precio de Compra:</strong> <span id="infoPrecioCompra"></span></p>
                    </div>

                    <div class="form-group">
                        <label>Nombre del Cliente:</label>
                        <input type="text" id="nombreCliente" placeholder="Nombre completo del cliente" />
                    </div>

                    <div class="form-group">
                        <label>Cédula del Cliente:</label>
                        <input type="text" id="cedulaCliente" placeholder="000-0000000-0" />
                    </div>

                    <div class="form-group">
                        <label>Teléfono del Cliente:</label>
                        <input type="tel" id="telefonoCliente" placeholder="(809) 000-0000" />
                    </div>

                    <div class="form-group">
                        <label>Precio de Venta Total (RD$):</label>
                        <input type="number" id="precioVentaFinanciado" placeholder="0.00" step="0.01" min="0" onchange="calcularCuotas()" />
                    </div>

                    <div class="form-group">
                        <label>Inicial (RD$):</label>
                        <input type="number" id="inicialFinanciado" placeholder="0.00" step="0.01" min="0" value="0" onchange="calcularCuotas()" />
                    </div>

                    <div class="form-group">
                        <label>Número de Cuotas:</label>
                        <select id="numeroCuotas" onchange="calcularCuotas()">
                            <option value="2">2 cuotas</option>
                            <option value="3">3 cuotas</option>
                            <option value="4">4 cuotas</option>
                            <option value="6">6 cuotas</option>
                            <option value="12">12 cuotas</option>
                            <option value="24">24 cuotas</option>
                        </select>
                    </div>

                    <div id="resumenFinanciamiento" class="resumen-financiamiento">
                        <h3>Resumen del Financiamiento</h3>
                        <div class="resumen-grid">
                            <div class="resumen-item">
                                <span class="label">Precio Total:</span>
                                <span class="valor" id="resumenTotal">RD$ 0.00</span>
                            </div>
                            <div class="resumen-item">
                                <span class="label">Inicial:</span>
                                <span class="valor" id="resumenInicial">RD$ 0.00</span>
                            </div>
                            <div class="resumen-item">
                                <span class="label">Saldo a Financiar:</span>
                                <span class="valor" id="resumenSaldo">RD$ 0.00</span>
                            </div>
                            <div class="resumen-item destacado">
                                <span class="label">Cuota Mensual:</span>
                                <span class="valor" id="resumenCuota">RD$ 0.00</span>
                            </div>
                        </div>
                    </div>

                    <div class="botones-modal">
                        <button onclick="procesarVentaFinanciada()" class="btn-confirmar">
                            ✅ Confirmar Venta Financiada
                        </button>
                        <button onclick="cerrarModalVentaFinanciada()" class="btn-cancelar">
                            ❌ Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function cerrarModalVentaFinanciada() {
    const modal = document.getElementById('modalVentaFinanciada');
    if (modal) {
        modal.remove();
    }
}

function actualizarInfoEquipo() {
    const equipoId = parseInt(document.getElementById('equipoFinanciado').value);
    const infoDiv = document.getElementById('infoEquipoSeleccionado');
    
    if (!equipoId) {
        infoDiv.style.display = 'none';
        return;
    }
    
    const equipo = equipos.find(eq => eq.id === equipoId);
    if (!equipo) return;
    
    document.getElementById('infoMarcaModelo').textContent = `${equipo.marca} ${equipo.modelo}`;
    document.getElementById('infoIMEI').textContent = equipo.imei;
    document.getElementById('infoPrecioCompra').textContent = `RD$ ${equipo.precioCompra.toLocaleString('es-DO', {minimumFractionDigits: 2})}`;
    
    infoDiv.style.display = 'block';
}

function calcularCuotas() {
    const precioVenta = parseFloat(document.getElementById('precioVentaFinanciado').value) || 0;
    const inicial = parseFloat(document.getElementById('inicialFinanciado').value) || 0;
    const numCuotas = parseInt(document.getElementById('numeroCuotas').value) || 1;
    
    const saldoFinanciar = precioVenta - inicial;
    const cuotaMensual = saldoFinanciar / numCuotas;
    
    document.getElementById('resumenTotal').textContent = `RD$ ${precioVenta.toLocaleString('es-DO', {minimumFractionDigits: 2})}`;
    document.getElementById('resumenInicial').textContent = `RD$ ${inicial.toLocaleString('es-DO', {minimumFractionDigits: 2})}`;
    document.getElementById('resumenSaldo').textContent = `RD$ ${saldoFinanciar.toLocaleString('es-DO', {minimumFractionDigits: 2})}`;
    document.getElementById('resumenCuota').textContent = `RD$ ${cuotaMensual.toLocaleString('es-DO', {minimumFractionDigits: 2})}`;
}

async function procesarVentaFinanciada() {
    const equipoId = parseInt(document.getElementById('equipoFinanciado').value);
    const nombreCliente = document.getElementById('nombreCliente').value.trim();
    const cedulaCliente = document.getElementById('cedulaCliente').value.trim();
    const telefonoCliente = document.getElementById('telefonoCliente').value.trim();
    const precioVenta = parseFloat(document.getElementById('precioVentaFinanciado').value);
    const inicial = parseFloat(document.getElementById('inicialFinanciado').value) || 0;
    const numCuotas = parseInt(document.getElementById('numeroCuotas').value);
    
    // Validaciones
    if (!equipoId) {
        alert('⚠️ Debes seleccionar un equipo');
        return;
    }
    
    if (!nombreCliente) {
        alert('⚠️ Debes ingresar el nombre del cliente');
        return;
    }
    
    if (!cedulaCliente) {
        alert('⚠️ Debes ingresar la cédula del cliente');
        return;
    }
    
    if (!telefonoCliente) {
        alert('⚠️ Debes ingresar el teléfono del cliente');
        return;
    }
    
    if (isNaN(precioVenta) || precioVenta <= 0) {
        alert('⚠️ Precio de venta inválido');
        return;
    }
    
    if (inicial > precioVenta) {
        alert('⚠️ El inicial no puede ser mayor que el precio de venta');
        return;
    }
    
    const equipo = equipos.find(eq => eq.id === equipoId);
    if (!equipo) {
        alert('⚠️ Equipo no encontrado');
        return;
    }
    
    const saldoFinanciar = precioVenta - inicial;
    const cuotaMensual = saldoFinanciar / numCuotas;
    const ganancia = precioVenta - equipo.precioCompra;
    const porcentajeGanancia = ((ganancia / equipo.precioCompra) * 100).toFixed(2);
    
    // Crear registro de cuotas
    const cuotas = [];
    const fechaInicio = new Date();
    
    for (let i = 1; i <= numCuotas; i++) {
        const fechaVencimiento = new Date(fechaInicio);
        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);
        
        cuotas.push({
            numero: i,
            monto: cuotaMensual,
            fechaVencimiento: fechaVencimiento.toLocaleDateString('es-ES'),
            pagada: false,
            fechaPago: null
        });
    }
    
    // Actualizar equipo
    equipo.estado = 'Vendido Financiado';
    equipo.precioVenta = precioVenta;
    equipo.ganancia = ganancia;
    equipo.fechaVenta = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Agregar información de financiamiento
    equipo.financiamiento = {
        nombreCliente,
        cedulaCliente,
        telefonoCliente,
        inicial,
        saldoFinanciar,
        numeroCuotas: numCuotas,
        cuotaMensual,
        cuotas,
        saldoPendiente: saldoFinanciar
    };
    
    await guardarEquipoFirebase(equipo);
    actualizarTabla();
    actualizarListaFinanciados();
    cerrarModalVentaFinanciada();
    
    const gananciaTexto = ganancia >= 0 ? 
        `✅ GANANCIA: RD$ ${ganancia.toLocaleString('es-DO', {minimumFractionDigits: 2})} (+${porcentajeGanancia}%)` :
        `❌ PÉRDIDA: RD$ ${Math.abs(ganancia).toLocaleString('es-DO', {minimumFractionDigits: 2})} (${porcentajeGanancia}%)`;
    
    alert(
        `🎉 ¡VENTA FINANCIADA REGISTRADA!\n\n` +
        `📱 Equipo: ${equipo.marca} ${equipo.modelo}\n` +
        `👤 Cliente: ${nombreCliente}\n` +
        `📞 Teléfono: ${telefonoCliente}\n\n` +
        `💰 Precio Total: RD$ ${precioVenta.toLocaleString('es-DO', {minimumFractionDigits: 2})}\n` +
        `💵 Inicial: RD$ ${inicial.toLocaleString('es-DO', {minimumFractionDigits: 2})}\n` +
        `📊 ${numCuotas} cuotas de RD$ ${cuotaMensual.toLocaleString('es-DO', {minimumFractionDigits: 2})}\n\n` +
        gananciaTexto
    );
}

// Función para gestionar cuotas
function gestionarCuotas(id) {
    const equipo = equipos.find(eq => eq.id === id);
    if (!equipo || !equipo.financiamiento) return;
    
    const fin = equipo.financiamiento;
    const modal = document.createElement('div');
    modal.id = 'modalGestionCuotas';
    
    const cuotasHTML = fin.cuotas.map(cuota => {
        const estadoCuota = cuota.pagada ? '✅ Pagada' : '⏳ Pendiente';
        const classCuota = cuota.pagada ? 'cuota-pagada' : 'cuota-pendiente';
        const fechaPago = cuota.pagada ? `<br><small>Pagada: ${cuota.fechaPago}</small>` : '';
        
        let botonesAccion = '';
        if (!cuota.pagada) {
            botonesAccion = `<button class="btn-pagar-cuota" onclick="pagarCuota(${id}, ${cuota.numero})">💰 Pagar</button>`;
        } else {
            botonesAccion = `<button class="btn-reimprimir" onclick="generarFacturaCuota(${id}, ${cuota.numero})">🖨️ Recibo</button>`;
        }
        
        return `
            <div class="cuota-item ${classCuota}">
                <div class="cuota-info">
                    <strong>Cuota ${cuota.numero}/${fin.numeroCuotas}</strong>
                    <span>RD$ ${cuota.monto.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="cuota-fecha">
                    <small>Vence: ${cuota.fechaVencimiento}</small>
                    ${fechaPago}
                </div>
                <div class="cuota-estado">
                    <span class="badge ${cuota.pagada ? 'badge-vendido' : 'badge-pendiente'}">${estadoCuota}</span>
                    ${botonesAccion}
                </div>
            </div>
        `;
    }).join('');
    
    const cuotasPagadas = fin.cuotas.filter(c => c.pagada).length;
    const totalPagado = fin.cuotas.filter(c => c.pagada).reduce((sum, c) => sum + c.monto, 0) + fin.inicial;
    const saldoPendiente = fin.cuotas.filter(c => !c.pagada).reduce((sum, c) => sum + c.monto, 0);
    const progreso = ((cuotasPagadas / fin.numeroCuotas) * 100).toFixed(0);
    
    modal.innerHTML = `
        <div class="modal-overlay" onclick="cerrarModalGestionCuotas()">
            <div class="modal-content modal-cuotas" onclick="event.stopPropagation()">
                <h2>💳 Gestión de Cuotas</h2>
                
                <div class="info-cliente-cuotas">
                    <h3>Información del Cliente</h3>
                    <p><strong>Nombre:</strong> ${fin.nombreCliente}</p>
                    <p><strong>Cédula:</strong> ${fin.cedulaCliente}</p>
                    <p><strong>Teléfono:</strong> ${fin.telefonoCliente}</p>
                    <p><strong>Equipo:</strong> ${equipo.marca} ${equipo.modelo} (${equipo.imei})</p>
                </div>
                
                <div class="resumen-pagos">
                    <div class="stat-pago">
                        <span class="label">Precio Total</span>
                        <span class="valor">RD$ ${equipo.precioVenta.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="stat-pago">
                        <span class="label">Inicial</span>
                        <span class="valor">RD$ ${fin.inicial.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="stat-pago">
                        <span class="label">Total Pagado</span>
                        <span class="valor pagado">RD$ ${totalPagado.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="stat-pago">
                        <span class="label">Saldo Pendiente</span>
                        <span class="valor pendiente">RD$ ${saldoPendiente.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                    </div>
                </div>
                
                <div class="progreso-pagos">
                    <div class="progreso-info">
                        <span>Progreso de Pagos</span>
                        <span><strong>${cuotasPagadas}/${fin.numeroCuotas}</strong> cuotas pagadas (${progreso}%)</span>
                    </div>
                    <div class="progreso-bar">
                        <div class="progreso-fill" style="width: ${progreso}%"></div>
                    </div>
                </div>
                
                <div class="lista-cuotas">
                    <h3>Detalle de Cuotas</h3>
                    ${cuotasHTML}
                </div>
                
                <button onclick="cerrarModalGestionCuotas()" class="btn-cerrar-cuotas">
                    ✖ Cerrar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function cerrarModalGestionCuotas() {
    const modal = document.getElementById('modalGestionCuotas');
    if (modal) {
        modal.remove();
    }
}

async function pagarCuota(equipoId, numeroCuota) {
    const equipo = equipos.find(eq => eq.id === equipoId);
    if (!equipo || !equipo.financiamiento) return;
    
    const cuota = equipo.financiamiento.cuotas.find(c => c.numero === numeroCuota);
    if (!cuota || cuota.pagada) return;
    
    if (confirm(`¿Confirmar pago de la cuota ${numeroCuota}?\n\nMonto: RD$ ${cuota.monto.toLocaleString('es-DO', {minimumFractionDigits: 2})}`)) {
        cuota.pagada = true;
        cuota.fechaPago = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Generar número de recibo único
        cuota.numeroRecibo = `REC-${Date.now()}-${numeroCuota}`;
        
        await guardarEquipoFirebase(equipo);
        
        // Cerrar y reabrir modal para actualizar
        cerrarModalGestionCuotas();
        gestionarCuotas(equipoId);
        
        // Preguntar si desea generar factura
        if (confirm(`✅ Cuota ${numeroCuota} marcada como pagada\n\n¿Desea generar una factura/recibo de pago?`)) {
            generarFacturaCuota(equipoId, numeroCuota);
        }
    }
}

function generarFacturaCuota(equipoId, numeroCuota) {
    const equipo = equipos.find(eq => eq.id === equipoId);
    if (!equipo || !equipo.financiamiento) return;
    
    const cuota = equipo.financiamiento.cuotas.find(c => c.numero === numeroCuota);
    if (!cuota || !cuota.pagada) return;
    
    const fin = equipo.financiamiento;
    const cuotasPagadas = fin.cuotas.filter(c => c.pagada).length;
    const totalPagadoCuotas = fin.cuotas.filter(c => c.pagada).reduce((sum, c) => sum + c.monto, 0);
    const totalPagado = totalPagadoCuotas + fin.inicial;
    const saldoPendiente = equipo.precioVenta - totalPagado;
    
    const facturaHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo de Pago - Cuota ${numeroCuota}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                background: #f5f5f5;
                padding: 20px;
            }
            .recibo-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px;
                text-align: center;
            }
            .header h1 {
                font-size: 2em;
                margin-bottom: 10px;
            }
            .header p {
                font-size: 1.1em;
                opacity: 0.9;
            }
            .recibo-numero {
                background: white;
                color: #667eea;
                padding: 15px 30px;
                margin: 20px auto 0;
                display: inline-block;
                border-radius: 25px;
                font-weight: 700;
                font-size: 1.1em;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }
            .contenido {
                padding: 40px;
            }
            .seccion {
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #f0f0f0;
            }
            .seccion:last-child {
                border-bottom: none;
            }
            .seccion h2 {
                color: #667eea;
                font-size: 1.3em;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 200px 1fr;
                gap: 12px;
                margin-bottom: 10px;
            }
            .info-label {
                font-weight: 600;
                color: #666;
            }
            .info-valor {
                color: #1a1a1a;
            }
            .monto-pagado {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 25px;
                border-radius: 12px;
                text-align: center;
                margin: 30px 0;
            }
            .monto-pagado .label {
                font-size: 0.9em;
                opacity: 0.9;
                margin-bottom: 10px;
            }
            .monto-pagado .valor {
                font-size: 2.5em;
                font-weight: 700;
            }
            .resumen-cuenta {
                background: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin-top: 20px;
            }
            .resumen-cuenta h3 {
                color: #374151;
                margin-bottom: 15px;
                font-size: 1.1em;
            }
            .resumen-linea {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            .resumen-linea:last-child {
                border-bottom: none;
                font-weight: 700;
                font-size: 1.1em;
                color: #ef4444;
            }
            .footer {
                background: #f9fafb;
                padding: 30px;
                text-align: center;
                border-top: 3px solid #667eea;
            }
            .footer p {
                color: #6b7280;
                margin: 5px 0;
                font-size: 0.9em;
            }
            .firma-seccion {
                margin-top: 50px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                text-align: center;
            }
            .firma-box {
                padding-top: 20px;
            }
            .firma-linea {
                border-top: 2px solid #333;
                margin-top: 60px;
                padding-top: 10px;
                font-weight: 600;
            }
            .nota {
                background: #fffbeb;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                margin-top: 20px;
                border-radius: 4px;
            }
            .nota strong {
                color: #92400e;
            }
            .btn-imprimir {
                background: #3b82f6;
                color: white;
                padding: 15px 40px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin: 20px;
            }
            .btn-imprimir:hover {
                background: #2563eb;
            }
            @media print {
                body { background: white; padding: 0; }
                .btn-imprimir { display: none; }
                .recibo-container { box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="recibo-container">
            <div class="header">
                <h1>📱 M y Z Smart Phone RD</h1>
                <p>Recibo de Pago de Cuota</p>
                <div class="recibo-numero">
                    Recibo No. ${cuota.numeroRecibo || 'REC-' + Date.now()}
                </div>
            </div>
            
            <div class="contenido">
                <div class="seccion">
                    <h2>📅 Información del Recibo</h2>
                    <div class="info-grid">
                        <div class="info-label">Fecha de Pago:</div>
                        <div class="info-valor">${cuota.fechaPago}</div>
                        
                        <div class="info-label">Cuota No.:</div>
                        <div class="info-valor">${numeroCuota} de ${fin.numeroCuotas}</div>
                        
                        <div class="info-label">Fecha de Vencimiento:</div>
                        <div class="info-valor">${cuota.fechaVencimiento}</div>
                    </div>
                </div>
                
                <div class="seccion">
                    <h2>👤 Información del Cliente</h2>
                    <div class="info-grid">
                        <div class="info-label">Nombre:</div>
                        <div class="info-valor">${fin.nombreCliente}</div>
                        
                        <div class="info-label">Cédula:</div>
                        <div class="info-valor">${fin.cedulaCliente}</div>
                        
                        <div class="info-label">Teléfono:</div>
                        <div class="info-valor">${fin.telefonoCliente}</div>
                    </div>
                </div>
                
                <div class="seccion">
                    <h2>📱 Información del Equipo</h2>
                    <div class="info-grid">
                        <div class="info-label">Equipo:</div>
                        <div class="info-valor">${equipo.marca} ${equipo.modelo}</div>
                        
                        <div class="info-label">IMEI:</div>
                        <div class="info-valor">${equipo.imei}</div>
                        
                        <div class="info-label">Fecha de Venta:</div>
                        <div class="info-valor">${equipo.fechaVenta}</div>
                    </div>
                </div>
                
                <div class="monto-pagado">
                    <div class="label">MONTO PAGADO</div>
                    <div class="valor">RD$ ${cuota.monto.toLocaleString('es-DO', {minimumFractionDigits: 2})}</div>
                </div>
                
                <div class="resumen-cuenta">
                    <h3>💳 Resumen de Cuenta</h3>
                    <div class="resumen-linea">
                        <span>Precio Total del Equipo:</span>
                        <span>RD$ ${equipo.precioVenta.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="resumen-linea">
                        <span>Inicial Pagado:</span>
                        <span>RD$ ${fin.inicial.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="resumen-linea">
                        <span>Cuotas Pagadas (${cuotasPagadas}/${fin.numeroCuotas}):</span>
                        <span>RD$ ${totalPagadoCuotas.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="resumen-linea">
                        <span>Total Pagado:</span>
                        <span>RD$ ${totalPagado.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="resumen-linea">
                        <span>SALDO PENDIENTE:</span>
                        <span>RD$ ${saldoPendiente.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                    </div>
                </div>
                
                <div class="nota">
                    <strong>⚠️ Nota Importante:</strong> Este recibo es válido como comprobante de pago de la cuota indicada. 
                    Conserve este documento para cualquier reclamación futura.
                </div>
                
                <div class="firma-seccion">
                    <div class="firma-box">
                        <div class="firma-linea">Firma del Cliente</div>
                    </div>
                    <div class="firma-box">
                        <div class="firma-linea">Firma del Vendedor</div>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>M y Z Smart Phone RD</strong></p>
                <p>República Dominicana</p>
                <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
                <p style="margin-top: 15px; font-size: 0.8em;">Este es un documento generado electrónicamente</p>
            </div>
        </div>
        
        <center>
            <button class="btn-imprimir" onclick="window.print()">🖨️ Imprimir Recibo</button>
        </center>
    </body>
    </html>
    `;
    
    // Abrir factura en nueva ventana
    const ventana = window.open('', '_blank');
    ventana.document.write(facturaHTML);
    ventana.document.close();
}

// Función para ver detalle de venta
function verDetalleVenta(id) {
    const equipo = equipos.find(eq => eq.id === id);
    if (!equipo || (equipo.estado !== 'Vendido' && equipo.estado !== 'Vendido Financiado')) return;

    const porcentajeGanancia = ((equipo.ganancia / equipo.precioCompra) * 100).toFixed(2);
    const gananciaTexto = equipo.ganancia >= 0 ? 
        `✅ Ganancia: RD$ ${equipo.ganancia.toLocaleString('es-DO', {minimumFractionDigits: 2})} (+${porcentajeGanancia}%)` :
        `❌ Pérdida: RD$ ${Math.abs(equipo.ganancia).toLocaleString('es-DO', {minimumFractionDigits: 2})} (${porcentajeGanancia}%)`;

    let mensaje = 
        `📊 DETALLE DE VENTA\n\n` +
        `📱 ${equipo.marca} ${equipo.modelo}\n` +
        `📦 Tipo: ${equipo.tipo}\n` +
        `🔢 IMEI: ${equipo.imei}\n` +
        `🏪 Suplidor: ${equipo.suplidor}\n\n` +
        `💵 Precio de Compra: RD$ ${equipo.precioCompra.toLocaleString('es-DO', {minimumFractionDigits: 2})}\n` +
        `💰 Precio de Venta: RD$ ${equipo.precioVenta.toLocaleString('es-DO', {minimumFractionDigits: 2})}\n\n` +
        gananciaTexto + `\n\n`;
    
    if (equipo.estado === 'Vendido Financiado' && equipo.financiamiento) {
        const fin = equipo.financiamiento;
        const cuotasPagadas = fin.cuotas.filter(c => c.pagada).length;
        const saldoPendiente = fin.cuotas.filter(c => !c.pagada).reduce((sum, c) => sum + c.monto, 0);
        
        mensaje += 
            `💳 FINANCIAMIENTO\n` +
            `👤 Cliente: ${fin.nombreCliente}\n` +
            `🆔 Cédula: ${fin.cedulaCliente}\n` +
            `📞 Teléfono: ${fin.telefonoCliente}\n` +
            `💵 Inicial: RD$ ${fin.inicial.toLocaleString('es-DO', {minimumFractionDigits: 2})}\n` +
            `📊 Cuotas: ${cuotasPagadas}/${fin.numeroCuotas} pagadas\n` +
            `💰 Cuota Mensual: RD$ ${fin.cuotaMensual.toLocaleString('es-DO', {minimumFractionDigits: 2})}\n` +
            `⚠️ Saldo Pendiente: RD$ ${saldoPendiente.toLocaleString('es-DO', {minimumFractionDigits: 2})}\n\n`;
    }
    
    mensaje += 
        `📅 Fecha de Registro: ${equipo.fecha}\n` +
        `📅 Fecha de Venta: ${equipo.fechaVenta}`;
    
    alert(mensaje);
}

// Función para filtrar equipos
function filtrarEquipos() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const tipoFiltro = document.getElementById('filterTipo').value;

    const equiposFiltrados = equipos.filter(equipo => {
        const coincideBusqueda = 
            equipo.marca.toLowerCase().includes(searchTerm) ||
            equipo.modelo.toLowerCase().includes(searchTerm) ||
            equipo.imei.includes(searchTerm) ||
            equipo.suplidor.toLowerCase().includes(searchTerm);

        const coincideTipo = !tipoFiltro || equipo.tipo === tipoFiltro;

        return coincideBusqueda && coincideTipo;
    });

    actualizarTabla(equiposFiltrados);
}

// Función para actualizar la tabla
function actualizarTabla(equiposMostrar = equipos) {
    const tbody = document.getElementById('equiposBody');
    const totalEquipos = document.getElementById('totalEquipos');
    
    console.log('Actualizando tabla con', equiposMostrar.length, 'equipos');
    console.log('Equipos a mostrar:', equiposMostrar);
    
    // Actualizar estadísticas del inventario
    if (totalEquipos) {
        totalEquipos.textContent = equipos.length;
    }
    
    const equiposDisponibles = document.getElementById('equiposDisponibles');
    if (equiposDisponibles) {
        equiposDisponibles.textContent = equipos.filter(eq => eq.estado === 'En Inventario').length;
    }
    
    const equiposVendidos = document.getElementById('equiposVendidos');
    if (equiposVendidos) {
        equiposVendidos.textContent = equipos.filter(eq => eq.estado === 'Vendido').length;
    }
    
    const equiposFinanciados = document.getElementById('equiposFinanciados');
    if (equiposFinanciados) {
        equiposFinanciados.textContent = equipos.filter(eq => eq.estado === 'Vendido Financiado').length;
    }

    if (equiposMostrar.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="9">No se encontraron equipos</td>
            </tr>
        `;
        return;
    }

    try {
        tbody.innerHTML = equiposMostrar.map(equipo => {
            let estadoClass = 'badge-inventario';
            if (equipo.estado === 'Vendido') estadoClass = 'badge-vendido';
            if (equipo.estado === 'Vendido Financiado') estadoClass = 'badge-financiado';
            
            const precioCompra = equipo.precioCompra || 0;
            const precioCompraFormat = `RD$ ${precioCompra.toLocaleString('es-DO', {minimumFractionDigits: 2})}`;
            
            let botonesAccion = '';
            if (equipo.estado === 'En Inventario') {
                botonesAccion = `
                    <button class="btn-vender" onclick="venderEquipo(${equipo.id})">
                        💰 Vender
                    </button>
                    <button class="btn-delete" onclick="eliminarEquipo(${equipo.id})">
                        🗑️
                    </button>
                `;
            } else if (equipo.estado === 'Vendido Financiado') {
                botonesAccion = `
                    <button class="btn-detalle" onclick="verDetalleVenta(${equipo.id})">
                        📊 Detalle
                    </button>
                    <button class="btn-cuotas" onclick="gestionarCuotas(${equipo.id})">
                        💳 Cuotas
                    </button>
                    <button class="btn-delete" onclick="eliminarEquipo(${equipo.id})">
                        🗑️
                    </button>
                `;
            } else {
                botonesAccion = `
                    <button class="btn-detalle" onclick="verDetalleVenta(${equipo.id})">
                        📊 Detalle
                    </button>
                    <button class="btn-delete" onclick="eliminarEquipo(${equipo.id})">
                        🗑️
                    </button>
                `;
            }
            
            return `
            <tr class="new-row">
                <td><span class="badge badge-${equipo.tipo.toLowerCase()}">${equipo.tipo}</span></td>
                <td>${equipo.marca}</td>
                <td>${equipo.modelo}</td>
                <td><code>${equipo.imei}</code></td>
                <td>${equipo.suplidor}</td>
                <td>${precioCompraFormat}</td>
                <td><span class="badge ${estadoClass}">${equipo.estado}</span></td>
                <td>${equipo.fecha}</td>
                <td class="acciones-cell">
                    ${botonesAccion}
                </td>
            </tr>
            `;
        }).join('');
        console.log('Tabla actualizada exitosamente');
    } catch (error) {
        console.error('Error al actualizar tabla:', error);
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="9">Error al mostrar equipos. Ver consola para detalles.</td>
            </tr>
        `;
    }
}

// Funciones de localStorage
// ============= FUNCIONES DE FIREBASE =============

async function guardarEquipos() {
    // Guardar también en localStorage como respaldo
    localStorage.setItem('inventario_myz_equipos', JSON.stringify(equipos));
    localStorage.setItem('inventario_myz_ultima_modificacion', new Date().toISOString());
}

async function cargarEquipos() {
    try {
        console.log('Iniciando carga desde Firebase...');
        console.log('Firebase DB disponible:', !!window.firebaseDB);
        
        // Cargar desde Firebase
        const querySnapshot = await window.firebaseGetDocs(window.firebaseCollection(window.firebaseDB, 'equipos'));
        equipos = [];
        
        console.log('Documentos encontrados en Firebase:', querySnapshot.size);
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Cargando equipo:', data.marca, data.modelo);
            equipos.push({
                ...data,
                firebaseId: doc.id // Guardar el ID de Firebase
            });
        });
        
        console.log('✅ Equipos cargados desde Firebase:', equipos.length);
        
        // Actualizar la tabla después de cargar
        if (equipos.length > 0) {
            actualizarTabla();
        }
        
        // Si no hay equipos en Firebase, intentar migrar desde localStorage
        if (equipos.length === 0) {
            const equiposGuardados = localStorage.getItem('inventario_myz_equipos');
            if (equiposGuardados) {
                const equiposLocal = JSON.parse(equiposGuardados);
                console.log('Migrando equipos desde localStorage a Firebase...');
                
                for (const equipo of equiposLocal) {
                    await guardarEquipoFirebase(equipo);
                }
                
                // Recargar después de la migración
                await cargarEquipos();
            }
        }
        
    } catch (error) {
        console.error('Error cargando desde Firebase:', error);
        // Fallback a localStorage
        const equiposGuardados = localStorage.getItem('inventario_myz_equipos');
        if (equiposGuardados) {
            equipos = JSON.parse(equiposGuardados);
            console.log('Cargados desde localStorage (fallback)');
        }
    }
}

async function guardarEquipoFirebase(equipo) {
    try {
        if (equipo.firebaseId) {
            // Actualizar equipo existente
            const equipoRef = window.firebaseDoc(window.firebaseDB, 'equipos', equipo.firebaseId);
            const equipoData = { ...equipo };
            delete equipoData.firebaseId; // No guardar el ID como campo
            await window.firebaseUpdateDoc(equipoRef, equipoData);
        } else {
            // Crear nuevo equipo
            const docRef = await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDB, 'equipos'), equipo);
            equipo.firebaseId = docRef.id;
        }
        
        // También guardar en localStorage como respaldo
        guardarEquipos();
    } catch (error) {
        console.error('Error guardando en Firebase:', error);
        // Al menos guardar en localStorage
        guardarEquipos();
    }
}

async function eliminarEquipoFirebase(firebaseId) {
    try {
        if (firebaseId) {
            await window.firebaseDeleteDoc(window.firebaseDoc(window.firebaseDB, 'equipos', firebaseId));
        }
    } catch (error) {
        console.error('Error eliminando de Firebase:', error);
    }
}

// ============= GESTIÓN Y SEGURIDAD DE DATOS =============

// Exportar a JSON
document.getElementById('btnExportarJSON').addEventListener('click', () => {
    const dataStr = JSON.stringify(equipos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario_myz_${obtenerFechaArchivo()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    actualizarUltimaExportacion();
    alert('✅ Datos exportados a JSON exitosamente');
});

// Exportar a Excel (CSV)
document.getElementById('btnExportarExcel').addEventListener('click', () => {
    if (equipos.length === 0) {
        alert('⚠️ No hay equipos para exportar');
        return;
    }

    let csv = 'Tipo,Marca,Modelo,IMEI,Suplidor,Precio Compra,Estado,Precio Venta,Ganancia,Fecha Registro,Fecha Venta\n';
    equipos.forEach(eq => {
        const precioCompra = eq.precioCompra || 0;
        const precioVenta = eq.precioVenta || '';
        const ganancia = eq.ganancia || '';
        const fechaVenta = eq.fechaVenta || '';
        csv += `${eq.tipo},${eq.marca},${eq.modelo},${eq.imei},${eq.suplidor},${precioCompra},${eq.estado},${precioVenta},${ganancia},"${eq.fecha}","${fechaVenta}"\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario_myz_${obtenerFechaArchivo()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    actualizarUltimaExportacion();
    alert('✅ Datos exportados a Excel exitosamente (incluye estado y ventas)');
});

// Reporte de Ventas
document.getElementById('btnReporteVentas').addEventListener('click', () => {
    mostrarSelectorFechas();
});

// Ventas Financiadas
document.getElementById('btnVentasFinanciadas').addEventListener('click', () => {
    mostrarVentasFinanciadas();
});

// Actualizar lista de financiados al cambiar de sección
function actualizarListaFinanciados() {
    const equiposFinanciados = equipos.filter(eq => eq.estado === 'Vendido Financiado');
    const listaContainer = document.getElementById('listaFinanciados');
    const totalFinanciados = document.getElementById('totalFinanciados');
    const totalPorCobrarElement = document.getElementById('totalPorCobrar');
    
    if (!listaContainer) return;
    
    // Actualizar contador
    if (totalFinanciados) {
        totalFinanciados.textContent = equiposFinanciados.length;
    }
    
    // Calcular total por cobrar
    let totalPorCobrar = 0;
    equiposFinanciados.forEach(eq => {
        if (eq.financiamiento && eq.financiamiento.cuotas) {
            const saldoPendiente = eq.financiamiento.cuotas
                .filter(c => !c.pagada)
                .reduce((sum, c) => sum + c.monto, 0);
            totalPorCobrar += saldoPendiente;
        }
    });
    
    if (totalPorCobrarElement) {
        totalPorCobrarElement.textContent = `RD$ ${totalPorCobrar.toLocaleString('es-DO', {minimumFractionDigits: 2})}`;
    }
    
    // Mostrar mensaje vacío o lista
    if (equiposFinanciados.length === 0) {
        listaContainer.innerHTML = `
            <div class="empty-financiados">
                <span class="icon-empty">💳</span>
                <p>No hay equipos financiados registrados</p>
                <small>Los equipos vendidos con financiamiento aparecerán aquí</small>
            </div>
        `;
        return;
    }
    
    // Generar lista de equipos financiados
    listaContainer.innerHTML = equiposFinanciados.map(equipo => {
        const fin = equipo.financiamiento;
        const cuotasPagadas = fin.cuotas.filter(c => c.pagada).length;
        const totalCuotas = fin.numeroCuotas;
        const progreso = ((cuotasPagadas / totalCuotas) * 100).toFixed(0);
        const saldoPendiente = fin.cuotas.filter(c => !c.pagada).reduce((sum, c) => sum + c.monto, 0);
        const totalPagado = fin.cuotas.filter(c => c.pagada).reduce((sum, c) => sum + c.monto, 0) + fin.inicial;
        
        let estadoClass = 'warning';
        if (cuotasPagadas === totalCuotas) estadoClass = 'success';
        else if (cuotasPagadas === 0) estadoClass = 'danger';
        
        return `
            <div class="financiado-item">
                <div class="financiado-icon">📱</div>
                
                <div class="financiado-info">
                    <h3>
                        ${equipo.marca} ${equipo.modelo}
                        <span class="badge badge-financiado">${equipo.tipo}</span>
                    </h3>
                    <div class="cliente-nombre">
                        👤 ${fin.nombreCliente} | 📞 ${fin.telefonoCliente}
                    </div>
                    
                    <div class="financiado-detalles">
                        <div class="detalle-item">
                            <span class="detalle-label">Precio Total</span>
                            <span class="detalle-valor">RD$ ${equipo.precioVenta.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="detalle-item">
                            <span class="detalle-label">Inicial Pagado</span>
                            <span class="detalle-valor success">RD$ ${fin.inicial.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="detalle-item">
                            <span class="detalle-label">Total Pagado</span>
                            <span class="detalle-valor success">RD$ ${totalPagado.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="detalle-item">
                            <span class="detalle-label">Saldo Pendiente</span>
                            <span class="detalle-valor ${estadoClass}">RD$ ${saldoPendiente.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="detalle-item">
                            <span class="detalle-label">Cuota Mensual</span>
                            <span class="detalle-valor">RD$ ${fin.cuotaMensual.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div class="detalle-item">
                            <span class="detalle-label">IMEI</span>
                            <span class="detalle-valor">${equipo.imei}</span>
                        </div>
                    </div>
                    
                    <div class="progreso-cuotas">
                        <div class="progreso-cuotas-label">
                            <span>Progreso de Cuotas</span>
                            <span><strong>${cuotasPagadas}/${totalCuotas}</strong> pagadas (${progreso}%)</span>
                        </div>
                        <div class="progreso-cuotas-bar">
                            <div class="progreso-cuotas-fill" style="width: ${progreso}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="financiado-acciones">
                    <button class="btn-financiado-accion btn-ver-cuotas" onclick="gestionarCuotas(${equipo.id})">
                        💳 Gestionar Cuotas
                    </button>
                    <button class="btn-financiado-accion btn-ver-detalle" onclick="verDetalleVenta(${equipo.id})">
                        📊 Ver Detalle
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function mostrarSelectorFechas() {
    const equiposVendidos = equipos.filter(eq => eq.estado === 'Vendido');
    
    if (equiposVendidos.length === 0) {
        alert('📊 No hay ventas registradas');
        return;
    }

    // Crear ventana modal para selección de fechas
    const modal = document.createElement('div');
    modal.id = 'modalFechas';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="cerrarModalFechas()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <h2>📅 Seleccionar Período de Reporte</h2>
                <p>Elige el rango de fechas para generar el reporte de ventas</p>
                
                <div class="opciones-fecha">
                    <button onclick="generarReporteCompleto()" class="btn-opcion btn-completo">
                        📊 Reporte Completo<br>
                        <small>Todas las ventas registradas</small>
                    </button>
                    
                    <button onclick="generarReporteHoy()" class="btn-opcion btn-hoy">
                        📅 Ventas de Hoy<br>
                        <small>${new Date().toLocaleDateString('es-ES')}</small>
                    </button>
                    
                    <button onclick="generarReporteSemana()" class="btn-opcion btn-semana">
                        📆 Última Semana<br>
                        <small>Últimos 7 días</small>
                    </button>
                    
                    <button onclick="generarReporteMes()" class="btn-opcion btn-mes">
                        🗓️ Último Mes<br>
                        <small>Últimos 30 días</small>
                    </button>
                </div>
                
                <div class="rango-personalizado">
                    <h3>O selecciona un rango personalizado:</h3>
                    <div class="input-group">
                        <div class="input-fecha">
                            <label>Desde:</label>
                            <input type="date" id="fechaDesde" value="${obtenerFechaHaceXDias(30)}">
                        </div>
                        <div class="input-fecha">
                            <label>Hasta:</label>
                            <input type="date" id="fechaHasta" value="${obtenerFechaHoy()}">
                        </div>
                    </div>
                    <button onclick="generarReportePersonalizado()" class="btn-generar">
                        🔍 Generar Reporte Personalizado
                    </button>
                </div>
                
                <button onclick="cerrarModalFechas()" class="btn-cerrar">✖ Cerrar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function cerrarModalFechas() {
    const modal = document.getElementById('modalFechas');
    if (modal) {
        modal.remove();
    }
}

function obtenerFechaHoy() {
    return new Date().toISOString().split('T')[0];
}

function obtenerFechaHaceXDias(dias) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    return fecha.toISOString().split('T')[0];
}

function parsearFechaVenta(fechaVenta) {
    if (!fechaVenta) return null;
    // Formato esperado: "DD/MM/YYYY, HH:MM"
    const partes = fechaVenta.split(',')[0].split('/');
    if (partes.length !== 3) return null;
    return new Date(partes[2], partes[1] - 1, partes[0]);
}

function filtrarVentasPorRango(fechaDesde, fechaHasta) {
    return equipos.filter(eq => {
        if (eq.estado !== 'Vendido' || !eq.fechaVenta) return false;
        
        const fechaVenta = parsearFechaVenta(eq.fechaVenta);
        if (!fechaVenta) return false;
        
        return fechaVenta >= fechaDesde && fechaVenta <= fechaHasta;
    });
}

function generarReporteCompleto() {
    cerrarModalFechas();
    const equiposVendidos = equipos.filter(eq => eq.estado === 'Vendido');
    mostrarReporteVentas(equiposVendidos, 'Reporte Completo - Todas las Ventas');
}

function generarReporteHoy() {
    cerrarModalFechas();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    
    const ventasHoy = filtrarVentasPorRango(hoy, manana);
    const titulo = `Ventas del Día - ${hoy.toLocaleDateString('es-ES')}`;
    mostrarReporteVentas(ventasHoy, titulo);
}

function generarReporteSemana() {
    cerrarModalFechas();
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    hace7Dias.setHours(0, 0, 0, 0);
    
    const ventasSemana = filtrarVentasPorRango(hace7Dias, hoy);
    const titulo = 'Reporte Semanal - Últimos 7 Días';
    mostrarReporteVentas(ventasSemana, titulo);
}

function generarReporteMes() {
    cerrarModalFechas();
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    hace30Dias.setHours(0, 0, 0, 0);
    
    const ventasMes = filtrarVentasPorRango(hace30Dias, hoy);
    const titulo = 'Reporte Mensual - Últimos 30 Días';
    mostrarReporteVentas(ventasMes, titulo);
}

function generarReportePersonalizado() {
    const fechaDesdeInput = document.getElementById('fechaDesde').value;
    const fechaHastaInput = document.getElementById('fechaHasta').value;
    
    if (!fechaDesdeInput || !fechaHastaInput) {
        alert('⚠️ Por favor selecciona ambas fechas');
        return;
    }
    
    const fechaDesde = new Date(fechaDesdeInput);
    fechaDesde.setHours(0, 0, 0, 0);
    const fechaHasta = new Date(fechaHastaInput);
    fechaHasta.setHours(23, 59, 59, 999);
    
    if (fechaDesde > fechaHasta) {
        alert('⚠️ La fecha inicial no puede ser mayor que la fecha final');
        return;
    }
    
    cerrarModalFechas();
    const ventasPersonalizadas = filtrarVentasPorRango(fechaDesde, fechaHasta);
    const titulo = `Reporte Personalizado - ${fechaDesde.toLocaleDateString('es-ES')} al ${fechaHasta.toLocaleDateString('es-ES')}`;
    mostrarReporteVentas(ventasPersonalizadas, titulo);
}

function mostrarReporteVentas(equiposVendidos, tituloReporte = 'Reporte de Ventas') {
    if (equiposVendidos.length === 0) {
        alert('📊 No hay ventas en el período seleccionado');
        return;
    }

    // Agrupar ventas por fecha
    const ventasPorFecha = {};
    equiposVendidos.forEach(eq => {
        const fecha = eq.fechaVenta ? eq.fechaVenta.split(',')[0] : 'Sin fecha';
        if (!ventasPorFecha[fecha]) {
            ventasPorFecha[fecha] = [];
        }
        ventasPorFecha[fecha].push(eq);
    });

    // Generar reporte HTML
    let reporteHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Ventas - M y Z Smart Phone</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                background: #f0f2f5;
                padding: 30px;
            }
            .container { max-width: 1200px; margin: 0 auto; }
            .header {
                background: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                text-align: center;
            }
            .header h1 { color: #1a1a1a; margin-bottom: 10px; }
            .header .fecha { color: #6b7280; font-size: 14px; }
            .resumen {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .stat-card {
                background: white;
                padding: 25px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                text-align: center;
            }
            .stat-card .valor {
                font-size: 2em;
                font-weight: 700;
                color: #1a1a1a;
                margin: 10px 0;
            }
            .stat-card .label {
                color: #6b7280;
                font-size: 0.9em;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .stat-card.ganancia { border-left: 4px solid #10b981; }
            .stat-card.ventas { border-left: 4px solid #3b82f6; }
            .stat-card.inversion { border-left: 4px solid #f59e0b; }
            .stat-card.margen { border-left: 4px solid #8b5cf6; }
            .cierre-dia {
                background: white;
                padding: 25px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                margin-bottom: 20px;
            }
            .cierre-dia h2 {
                color: #1a1a1a;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e5e7eb;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            th, td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #f3f4f6;
            }
            th {
                background: #f9fafb;
                font-weight: 600;
                color: #374151;
                font-size: 0.85em;
                text-transform: uppercase;
            }
            td { color: #1f2937; }
            .total-dia {
                background: #f9fafb;
                padding: 15px;
                border-radius: 8px;
                margin-top: 15px;
                display: flex;
                justify-content: space-between;
                font-weight: 600;
            }
            .ganancia-positiva { color: #10b981; }
            .ganancia-negativa { color: #ef4444; }
            .btn-imprimir {
                background: #3b82f6;
                color: white;
                padding: 15px 30px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin: 20px auto;
                display: block;
            }
            .btn-imprimir:hover { background: #2563eb; }
            @media print {
                body { background: white; padding: 0; }
                .btn-imprimir { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🧾 Reporte de Ventas</h1>
                <div class="fecha">M y Z Smart Phone RD - Generado: ${new Date().toLocaleString('es-ES')}</div>
            </div>
    `;

    // Calcular totales generales
    let totalInversion = 0;
    let totalVentas = 0;
    let totalGanancia = 0;
    let totalEquiposVendidos = equiposVendidos.length;

    equiposVendidos.forEach(eq => {
        totalInversion += eq.precioCompra || 0;
        totalVentas += eq.precioVenta || 0;
        totalGanancia += eq.ganancia || 0;
    });

    const margenPromedio = totalInversion > 0 ? ((totalGanancia / totalInversion) * 100).toFixed(2) : 0;

    // Resumen general
    reporteHTML += `
            <div class="resumen">
                <div class="stat-card ganancia">
                    <div class="label">Ganancia Total</div>
                    <div class="valor ${totalGanancia >= 0 ? 'ganancia-positiva' : 'ganancia-negativa'}">
                        RD$ ${totalGanancia.toLocaleString('es-DO', {minimumFractionDigits: 2})}
                    </div>
                </div>
                <div class="stat-card ventas">
                    <div class="label">Total Ventas</div>
                    <div class="valor">RD$ ${totalVentas.toLocaleString('es-DO', {minimumFractionDigits: 2})}</div>
                </div>
                <div class="stat-card inversion">
                    <div class="label">Total Inversión</div>
                    <div class="valor">RD$ ${totalInversion.toLocaleString('es-DO', {minimumFractionDigits: 2})}</div>
                </div>
                <div class="stat-card margen">
                    <div class="label">Margen Promedio</div>
                    <div class="valor">${margenPromedio}%</div>
                </div>
            </div>
    `;

    // Cierre por día
    Object.keys(ventasPorFecha).sort().reverse().forEach(fecha => {
        const ventasDelDia = ventasPorFecha[fecha];
        let inversionDia = 0;
        let ventasDia = 0;
        let gananciaDia = 0;

        reporteHTML += `
            <div class="cierre-dia">
                <h2>📅 ${fecha} (${ventasDelDia.length} equipos vendidos)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Marca/Modelo</th>
                            <th>IMEI</th>
                            <th>Precio Compra</th>
                            <th>Precio Venta</th>
                            <th>Ganancia</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        ventasDelDia.forEach(eq => {
            const precioCompra = eq.precioCompra || 0;
            const precioVenta = eq.precioVenta || 0;
            const ganancia = eq.ganancia || 0;
            
            inversionDia += precioCompra;
            ventasDia += precioVenta;
            gananciaDia += ganancia;

            const gananciaClass = ganancia >= 0 ? 'ganancia-positiva' : 'ganancia-negativa';
            
            reporteHTML += `
                        <tr>
                            <td>${eq.tipo}</td>
                            <td>${eq.marca} ${eq.modelo}</td>
                            <td><code>${eq.imei}</code></td>
                            <td>RD$ ${precioCompra.toLocaleString('es-DO', {minimumFractionDigits: 2})}</td>
                            <td>RD$ ${precioVenta.toLocaleString('es-DO', {minimumFractionDigits: 2})}</td>
                            <td class="${gananciaClass}">RD$ ${ganancia.toLocaleString('es-DO', {minimumFractionDigits: 2})}</td>
                        </tr>
            `;
        });

        const margenDia = inversionDia > 0 ? ((gananciaDia / inversionDia) * 100).toFixed(2) : 0;

        reporteHTML += `
                    </tbody>
                </table>
                <div class="total-dia">
                    <div>
                        <strong>Inversión:</strong> RD$ ${inversionDia.toLocaleString('es-DO', {minimumFractionDigits: 2})} |
                        <strong>Ventas:</strong> RD$ ${ventasDia.toLocaleString('es-DO', {minimumFractionDigits: 2})}
                    </div>
                    <div class="${gananciaDia >= 0 ? 'ganancia-positiva' : 'ganancia-negativa'}">
                        <strong>Ganancia:</strong> RD$ ${gananciaDia.toLocaleString('es-DO', {minimumFractionDigits: 2})} (${margenDia}%)
                    </div>
                </div>
            </div>
        `;
    });

    reporteHTML += `
            <button class="btn-imprimir" onclick="window.print()">🖨️ Imprimir Reporte</button>
        </div>
    </body>
    </html>
    `;

    // Abrir reporte en nueva ventana
    const ventana = window.open('', '_blank');
    ventana.document.write(reporteHTML);
    ventana.document.close();
}

// Importar datos
document.getElementById('btnImportar').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const importados = JSON.parse(event.target.result);
            
            if (!Array.isArray(importados)) {
                throw new Error('Formato de archivo inválido');
            }

            const confirmacion = confirm(
                `¿Deseas importar ${importados.length} equipos?\n\n` +
                `Opción 1: Agregar a los existentes (OK)\n` +
                `Opción 2: Reemplazar todos los datos (Cancelar y usar Restaurar Backup)`
            );

            if (confirmacion) {
                // Agregar sin duplicar IMEIs
                let agregados = 0;
                let duplicados = 0;

                for (const equipo of importados) {
                    if (!equipos.some(eq => eq.imei === equipo.imei)) {
                        equipos.push(equipo);
                        await guardarEquipoFirebase(equipo); // Guardar cada equipo en Firebase
                        agregados++;
                    } else {
                        duplicados++;
                    }
                }

                guardarEquipos();
                actualizarTabla();
                alert(`✅ Importación completada:\n- ${agregados} equipos agregados\n- ${duplicados} duplicados omitidos`);
            }
        } catch (error) {
            alert('❌ Error al importar el archivo: ' + error.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// Crear Backup
document.getElementById('btnBackup').addEventListener('click', () => {
    const backup = {
        fecha: new Date().toISOString(),
        version: '1.0',
        total: equipos.length,
        datos: equipos
    };

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_myz_${obtenerFechaArchivo()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert(`✅ Backup creado exitosamente\n📊 Total de equipos: ${equipos.length}`);
});

// Restaurar Backup
document.getElementById('btnRestaurar').addEventListener('click', () => {
    if (!confirm('⚠️ ¿Estás seguro de restaurar un backup? Esto REEMPLAZARÁ todos los datos actuales.')) {
        return;
    }
    document.getElementById('backupInput').click();
});

document.getElementById('backupInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const backup = JSON.parse(event.target.result);
            
            if (!backup.datos || !Array.isArray(backup.datos)) {
                throw new Error('Formato de backup inválido');
            }

            equipos = backup.datos;
            // Guardar todos en Firebase
            for (const equipo of equipos) {
                await guardarEquipoFirebase(equipo);
            }
            guardarEquipos();
            actualizarTabla();
            
            alert(
                `✅ Backup restaurado exitosamente\n\n` +
                `📅 Fecha del backup: ${new Date(backup.fecha).toLocaleString('es-ES')}\n` +
                `📊 Equipos restaurados: ${backup.total}`
            );
        } catch (error) {
            alert('❌ Error al restaurar el backup: ' + error.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// Funciones auxiliares
function obtenerFechaArchivo() {
    const ahora = new Date();
    return ahora.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
}

function actualizarUltimaExportacion() {
    const ahora = new Date().toLocaleString('es-ES');
    localStorage.setItem('inventario_myz_ultima_exportacion', ahora);
    document.getElementById('ultimaExportacion').textContent = ahora;
}

// Cargar última exportación al iniciar
function cargarUltimaExportacion() {
    const ultima = localStorage.getItem('inventario_myz_ultima_exportacion');
    if (ultima) {
        document.getElementById('ultimaExportacion').textContent = ultima;
    }
}
