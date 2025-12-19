# 📦 Crear Paquete de Venta

## Cómo empaquetar el sistema para venderlo

### Opción 1: Crear ZIP Manualmente

1. Seleccionar estos archivos:
   - index.html
   - script.js
   - styles.css
   - INICIAR_SISTEMA.html
   - diagnostico.html
   - MANUAL_DE_USUARIO.md
   - INSTALACION.md
   - SEGURIDAD_Y_GARANTIAS.md
   - README.md

2. Click derecho → Enviar a → Carpeta comprimida (ZIP)

3. Renombrar a: `inventario-myz-v1.0.zip`

### Opción 2: Usar PowerShell (Automático)

Ejecutar este comando en PowerShell desde la carpeta del proyecto:

```powershell
Compress-Archive -Path index.html,script.js,styles.css,INICIAR_SISTEMA.html,diagnostico.html,*.md -DestinationPath inventario-myz-v1.0.zip -Force
```

### Opción 3: Incluir Todo en una Carpeta

1. Crear carpeta: `Sistema_Inventario_MYZ_v1.0`
2. Copiar todos los archivos dentro
3. Comprimir la carpeta completa
4. Resultado: `Sistema_Inventario_MYZ_v1.0.zip`

---

## 📋 Checklist de Archivos a Incluir

### Archivos Esenciales (Obligatorios)
- [x] index.html - Sistema principal
- [x] script.js - Programación
- [x] styles.css - Diseño
- [x] INICIAR_SISTEMA.html - Pantalla de inicio

### Documentación (Obligatorios)
- [x] MANUAL_DE_USUARIO.md - Manual completo
- [x] INSTALACION.md - Guía de instalación
- [x] README.md - Información general

### Archivos Opcionales
- [ ] diagnostico.html - Herramienta de diagnóstico
- [ ] SEGURIDAD_Y_GARANTIAS.md - Info de seguridad
- [ ] datos-ejemplo.json - Datos de demostración
- [ ] video-tutorial.mp4 - Tutorial en video

### Personalización del Cliente (Cuando aplique)
- [ ] Logo del cliente
- [ ] Configuración personalizada
- [ ] Manual con nombre del negocio

---

## 💾 Tamaño Final del Paquete

- **Archivos básicos:** ~150 KB
- **Con documentación:** ~200 KB
- **Con videos tutorial:** ~50 MB

---

## 📨 Formas de Entrega

### 1. Email
- Adjuntar ZIP (si <10 MB)
- Usar WeTransfer o Google Drive (si >10 MB)

### 2. USB
- Copiar carpeta completa
- Incluir archivo "LEER_PRIMERO.txt"

### 3. WhatsApp
- Enviar ZIP como documento
- Máximo 100 MB

### 4. Google Drive / Dropbox
- Crear enlace compartido
- Dar acceso solo al cliente

---

## ✅ Antes de Entregar

Verificar:
- [ ] Todos los archivos incluidos
- [ ] Sistema funciona correctamente
- [ ] Manuales actualizados
- [ ] Precios actualizados en documentos
- [ ] Datos de contacto correctos
- [ ] Versión correcta

---

## 🎁 Estructura Recomendada del ZIP

```
inventario-myz-v1.0.zip
│
├── LEER_PRIMERO.txt
├── INICIAR_SISTEMA.html
├── index.html
├── script.js
├── styles.css
├── diagnostico.html
│
├── documentacion/
│   ├── MANUAL_DE_USUARIO.md
│   ├── INSTALACION.md
│   ├── SEGURIDAD_Y_GARANTIAS.md
│   └── README.md
│
└── ejemplos/ (opcional)
    └── datos-ejemplo.json
```

---

## 📝 Archivo LEER_PRIMERO.txt

Crear este archivo en la raíz del ZIP:

```
╔═══════════════════════════════════════════╗
║   SISTEMA DE INVENTARIO M Y Z - v1.0     ║
╚═══════════════════════════════════════════╝

¡Gracias por su compra!

INICIO RÁPIDO:
1. Extraer todos los archivos
2. Abrir "INICIAR_SISTEMA.html"
3. ¡Listo!

DOCUMENTACIÓN:
Ver carpeta "documentacion" para manuales completos

SOPORTE:
WhatsApp: [Tu número]
Email: [Tu email]

¡Éxitos con su negocio!
```

---

## 💰 Lista de Precios para Actualizar

Antes de vender, actualizar estos archivos con tus precios:

1. MANUAL_DE_USUARIO.md (sección Licencias)
2. README.md (sección Proyección de Ingresos)
3. Tus datos de contacto en todos los archivos

---

¡Sistema listo para vender! 🚀
