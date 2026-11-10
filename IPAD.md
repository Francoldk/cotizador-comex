# Cotizador Comex para iPad 2

Interfaz independiente para Safari de iOS 9, con la marca y las fórmulas del cotizador actual. Se abre en `/ipad/index.html` y se puede agregar a Inicio desde Safari.

## Funciones

- Datos del cliente, producto, posición arancelaria, incoterm, valor, peso y volumen.
- Las cuatro modalidades del cotizador: compartido marítimo, marítimo por CBM, courier aéreo y All In aéreo.
- Tarifa, honorarios, seguro, gastos y alícuotas editables, con las mismas opciones de inclusión del original.
- Conversión a pesos manual o por dólar Oficial, Blue o Cripto, usando el valor de venta.
- Vista de cotización, resumen para copiar y envío de texto por la conexión WhatsApp existente.
- Copiado con selección manual cuando el navegador antiguo no permite copiar automáticamente.
- Impresión con un diseño de documento. Guardar o compartir un PDF depende de las opciones de impresión del sistema y del navegador; no se incorpora un generador de PDF del servidor.

Las tarifas iniciales reproducen las del código actual: 8.5, 350, 16.5 y 48 USD según modalidad. Las fórmulas y los valores iniciales se comparan con `app/page.js` en las pruebas. Esta adaptación técnica no revisa ni actualiza la normativa o las alícuotas impositivas.

## Publicación

En el repositorio `Francoldk/cotizador-comex`, incorporar:

1. `public/ipad/` con los cinco archivos de la interfaz.
2. `app/api/ipad/exchange-rate/route.js` para obtener el dólar desde el mismo dominio.

Desplegar con la configuración actual de Next.js/Vercel. No requiere dependencias, claves ni variables nuevas. El envío sigue usando `POST /api/send-quote`.

En la dirección donde ya abrís el cotizador, agregá `/ipad/index.html`. Usá el dominio activo configurado en Vercel; la dirección de inicio guardada como metadato del repositorio puede estar desactualizada.

Para agregar el ícono: Safari → Compartir → Agregar a inicio → Agregar.

## Comportamiento

Los datos de los clientes no se guardan en localStorage ni se copian a otra base de datos. Al enviar, se captura el número y la cotización de ese momento. El botón evita el doble toque; los errores conservan los campos y no reintentan automáticamente. Ante un envío sin confirmación, revisar el chat antes de reenviar.

El dólar se consulta al activar el modo en vivo, cambiar el tipo o tocar Actualizar dólar. Si falla, queda disponible el ingreso manual. Las respuestas antiguas se descartan al cambiar el tipo de cambio.

## Verificación

- `node tests/ipad-calculator.cjs`: 1.617 combinaciones comparadas exactamente contra las fórmulas originales.
- `node tests/ipad-rate-route.cjs`: tipos admitidos, datos válidos, errores y caché.
- `node tests/ipad-ui.cjs`: totales, referencia, texto seguro, copia manual, impresión, destino y contenido del envío, doble toque, errores y respuestas fuera de orden.
- Sintaxis ECMAScript 5 de los dos scripts del iPad.
- `npm run build` y revisión visual en navegador con datos ficticios.

Falta la prueba física en iPad 2 y un envío real desde la cuenta del usuario. Las pruebas de envío usan respuestas simuladas y no envían mensajes a clientes.

## Revertir

Eliminar `public/ipad` y `app/api/ipad/exchange-rate` y desplegar nuevamente. La página principal del cotizador y sus rutas de envío no se modifican.
