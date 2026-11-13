# MIAH · Catálogo y pedidos

Aplicación web para **MIAH (Mia Handbags SV)**, marca salvadoreña de bolsos tejidos a mano con fibras de plástico reciclado y materiales naturales.

**Versión publicada:** https://eandressrod.github.io/desafio-practico/

Desafío Práctico II · Desarrollo Web I · 2026. Amplía el sitio informativo del Desafío I con cuentas, roles, base de datos en la nube y procesos de gestión.

---

## 1. Problema y procesos

**Problema.** MIAH vende piezas artesanales en pocas unidades. Hasta ahora los pedidos llegaban por WhatsApp e Instagram y el inventario se llevaba a mano. Por eso era fácil prometer un bolso que ya no estaba disponible, perder pedidos entre mensajes o no saber cuánto se había vendido.

**Solución.** Un catálogo en línea conectado al inventario real, donde los clientes hacen pedidos y la administración los gestiona en un solo lugar.

La aplicación tiene **dos procesos relacionados**:

| Proceso | Quién | Qué hace |
|---|---|---|
| **P1. Catálogo e inventario** | Administrador | Registra, edita, oculta y elimina productos con precio, stock, línea, materiales y variantes. Ve el valor del inventario y los productos por reponer. |
| **P2. Pedidos** | Cliente y administrador | El cliente pide un producto del catálogo (sin pasar del stock disponible), sigue su estado y puede cancelarlo mientras esté pendiente. El administrador confirma, entrega o cancela pedidos. |

Los dos procesos están conectados: **al confirmar un pedido, el stock del producto baja automáticamente**. Si ya no alcanza, el pedido no se puede confirmar. El catálogo muestra "Agotado" cuando el stock llega a 0.

Estados de un pedido:

```
pendiente ──► confirmado ──► entregado
    │
    └──────► cancelado
```

## 2. Roles

| Rol | Cómo se obtiene | Puede |
|---|---|---|
| **Visitante** | Sin cuenta | Ver el sitio y el catálogo. |
| **Cliente** | Al registrarse (rol por defecto) | Hacer pedidos, ver solo sus pedidos y cancelar los pendientes. |
| **Administrador** | Asignado a mano en Firebase; nadie puede dárselo a sí mismo | Gestionar productos, ver todos los pedidos, cambiar su estado y ver los indicadores. |

## 3. Tecnologías

- **HTML5, CSS3 y JavaScript** nativo, con módulos ES (`import` / `export`). Sin frameworks.
- **Firebase Authentication** (correo y contraseña) para registro, inicio y cierre de sesión.
- **Cloud Firestore** como base de datos, con **reglas de seguridad** versionadas en `firestore.rules`.
- **GitHub Pages** como hosting.
- Fuentes Cormorant Garamond y Poppins (Google Fonts).

No hay servidor propio: el navegador habla directamente con Firebase y las reglas deciden qué se permite.

## 4. Estructura del proyecto

```
├── index.html, nosotros.html, contacto.html   Páginas informativas
├── catalogo.html                              Catálogo público (desde Firestore)
├── login.html                                 Iniciar sesión y crear cuenta
├── pedido.html                                Hacer un pedido (cliente)
├── mis-pedidos.html                           Pedidos del cliente
├── admin-productos.html                       Gestión de productos (admin)
├── admin-pedidos.html                         Gestión de pedidos (admin)
├── css/
│   ├── base.css        Común a todas: variables, encabezado, botones y pie
│   ├── app.css         Páginas de la aplicación: formularios, tablas, avisos
│   └── index.css, nosotros.css, contacto.css, catalogo.css   Lo propio de cada página
├── js/
│   ├── firebase.js     Configuración: conecta con el proyecto de Firebase
│   ├── services/       Datos: única capa que habla con Firebase
│   │   ├── auth.js         registrar, iniciarSesion, cerrarSesion, observarSesion, exigirSesion
│   │   ├── productos.js    CRUD de productos
│   │   ├── pedidos.js      crear, listar, cambiar estado (con transacción) y cancelar
│   │   ├── semilla.js      carga de datos iniciales
│   │   └── respuestas.js   forma común de respuesta y mensajes de error en español
│   ├── data/datos-iniciales.js   Productos reales y pedidos de ejemplo
│   ├── ui/             Interfaz común: menú según la sesión, carga, avisos, confirmaciones
│   ├── utils/formato.js          Formato de precios y fechas
│   └── pages/          Un archivo por página: eventos, validaciones y DOM
├── firestore.rules     Reglas de seguridad
└── firebase.json, .firebaserc   Configuración de Firebase CLI
```

La aplicación separa **configuración** (`firebase.js`), **datos** (`services/`) e **interfaz** (`ui/` y `pages/`). Las páginas nunca importan Firebase directamente. Todas las funciones de `services/` responden igual: `{ ok: true, data }` o `{ ok: false, error }`, con el error ya escrito en español para mostrarlo.

## 5. Configuración de Firebase

Proyecto: **`miah-catalogo-2026`** (Firestore en la región `nam5`).

1. **Configuración web.** Está en `js/firebase.js`. Esos datos (`apiKey`, `projectId`…) solo identifican el proyecto: no son secretos y está bien que sean públicos. La seguridad la ponen las reglas de Firestore.
2. **Autenticación.** El proveedor activo es correo y contraseña. Los dominios autorizados son `eandressrod.github.io`, `localhost` y `127.0.0.1`.
3. **Colecciones:**

   | Colección | Campos principales | Relación |
   |---|---|---|
   | `usuarios/{uid}` | `nombre`, `correo`, `rol`, `creadoEn` | Un documento por cuenta; guarda el rol. |
   | `productos/{id}` | `nombre`, `linea`, `descripcion`, `materiales`, `variantes`, `precio`, `stock`, `imagen`, `activo` | — |
   | `pedidos/{id}` | `clienteId`, `clienteNombre`, `productoId`, `productoNombre`, `cantidad`, `precioUnitario`, `total`, `estado`, `nota`, `creadoEn` | Apunta a un usuario y a un producto. Guarda nombre y precio del momento del pedido para conservar el historial. |

4. **Publicar las reglas** (requiere Firebase CLI y acceso al proyecto):

   ```bash
   firebase deploy --only firestore:rules,auth --project miah-catalogo-2026
   ```

5. **Crear un administrador.** La persona se registra en la web como cliente. Luego, en la consola de Firebase, en `Firestore → usuarios → {su uid}`, se cambia `rol` de `cliente` a `admin`.

### Datos iniciales

`js/data/datos-iniciales.js` tiene los 8 productos de MIAH y 6 pedidos de ejemplo en los cuatro estados.

1. Registrar en la web las cuentas de cliente de prueba (`cliente1@miah.test` y `cliente2@miah.test`). Los pedidos de ejemplo se relacionan con ellas por correo.
2. Entrar como administrador → **Productos** → **Cargar datos iniciales**. El botón solo aparece cuando no hay productos.

## 6. Seguridad y reglas

Ocultar botones en la interfaz no protege nada. Por eso cada permiso se comprueba **en los servidores de Firebase** con `firestore.rules`:

- **Nadie puede volverse administrador.** Al registrarse solo se puede crear el propio documento de usuario, siempre con `rol: 'cliente'`. Después solo se puede cambiar el nombre.
- **Productos:** lectura pública; crear, editar y eliminar solo el administrador. Se validan los campos y los tipos: precio mayor que 0 y stock entero de 0 o más.
- **Pedidos:**
  - Cada cliente lee solo los suyos; el administrador lee todos.
  - Un cliente solo crea pedidos propios y en estado `pendiente`. El nombre y el precio deben coincidir con el producto real, que debe estar activo y tener stock suficiente. La cantidad va de 1 a 20 y el total debe ser `cantidad × precio`.
  - El cliente solo puede pasar un pedido propio de `pendiente` a `cancelado`. El administrador solo puede hacer los cambios de estado permitidos (ver el diagrama del punto 1).
  - Los pedidos no se borran: quedan como historial.
- **Stock confiable:** confirmar un pedido usa una **transacción**. Lee el stock actual, verifica que alcance y actualiza pedido y producto juntos, o ninguno.
- **Sin secretos en el repositorio:** las contraseñas de prueba se entregan por Moodle.

Las páginas privadas usan `exigirSesion()`: sin sesión mandan al login y después regresan a la página. Esto es solo comodidad; la protección real está en las reglas.

## 7. Cómo probar

### En la versión publicada

Abrir https://eandressrod.github.io/desafio-practico/. Las credenciales de prueba (administrador y clientes) se entregan por Moodle.

**Como visitante**
1. Entrar a **Catálogo**: buscar por nombre o material, filtrar por línea y ordenar por nombre o precio.
2. Los productos sin stock aparecen como **Agotado**.
3. Pulsar **Pedir** lleva al inicio de sesión.

**Como cliente**
1. En **Iniciar sesión → Crear cuenta**, registrarse. También se puede entrar con una cuenta de prueba.
2. En el catálogo, elegir un bolso → **Pedir**. El total se calcula mientras se escribe la cantidad. No deja pedir más del stock.
3. Enviar el pedido: se abre **Mis pedidos** con el pedido en estado *pendiente*.
4. Filtrar por estado y **Cancelar** un pedido pendiente.
5. Intentar abrir `admin-pedidos.html` manda al inicio. Las reglas tampoco dejan leer datos ajenos.

**Como administrador**
1. Iniciar sesión con la cuenta de administrador: se abre **Pedidos**.
2. Revisar los indicadores: pedidos por estado, ingresos confirmados y producto más pedido.
3. Buscar por cliente o producto, filtrar por estado y ordenar por fecha.
4. **Confirmar** un pedido pendiente. En **Productos**, el stock de ese bolso bajó.
5. En **Productos**:
   - Crear un producto. No se puede repetir el nombre, y precio y stock se validan.
   - Editarlo, ocultarlo del catálogo y eliminarlo.
   - Revisar el valor del inventario y la lista de productos por reponer.
6. **Cerrar sesión** desde el menú.

### En local

Las páginas usan módulos ES, así que hay que abrirlas desde un servidor local; abrir el archivo con doble clic no funciona. Por ejemplo, con la extensión **Live Server** de VS Code, o con:

```bash
npx serve .
```

Luego abrir `http://localhost:3000`. Se usa el mismo proyecto de Firebase que la versión publicada.

## 8. Equipo

| Integrante | Parte principal |
|---|---|
| **eandress** | Firebase: configuración, servicios (`js/services/`), reglas de seguridad, publicación y refactorización final. |
| **Pablo** | Negocio: datos reales de productos, catálogo dinámico, gestión de productos e indicadores de inventario. |
| **DMoralGar** | Cuentas y pedidos: interfaz común (`js/ui/`), inicio de sesión, pedido, mis pedidos y gestión de pedidos. |
