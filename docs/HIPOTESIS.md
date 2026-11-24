# Hipótesis, alcance y decisiones de ingeniería

## Alcance

Se calculan **magnitudes de fuerzas sísmicas globales** por dirección para equipo/elemento y anclajes; no se determinan reacciones por perno, geometría, torsión, flexión local, comportamiento dinámico de la estructura principal, combinaciones ni resistencias. El ingeniero debe obtener cargas locales y combinaciones en una etapa independiente. No amplificar de nuevo los resultados entregados en la columna de anclajes.

## NCh2369:2025 capítulo 7

- El método implementado emplea el procedimiento simplificado de §7.2.2 y la aproximación de aceleración de §7.2.3; no corresponde a un análisis sísmico completo de la estructura principal.
- **H** es la altura de la estructura sobre su nivel basal según el modelo de referencia; **Zk** es la elevación del nivel de apoyo del equipo respecto del basal, no la altura propia del equipo. Con estructura elevada: `H>0`, `0<=Zk<=H`. Con apoyo basal: `Zk=0` y no se requiere H.
- Un zócalo/bastidor propio de una sala modular apoyada basalmente no se trata automáticamente como un piso superior.
- La selección de ductilidad de equipo o anclaje es responsabilidad del diseñador; la aplicación no demuestra el detalle dúctil ni §8.5.
- La componente vertical del método se reporta como magnitud positiva y no recibe amplificación horizontal de anclajes.

## Anexo Técnico CNE artículo 87 — interpretación de «cualquier dirección»

**Decisión FS-08, 23-11-2026.** El artículo 87 exige frecuencia equivalente mínima de 20 Hz «en cualquier dirección» y remite al artículo 122.4.iii, que define su determinación utilizando masa y **rigidez lateral** de la estructura de soporte. **Importante: el artículo 87 especifica que la masa de las celdas de baterías se distribuya en sus bases de apoyo sobre la estructura**, mientras que el artículo 122.4.iii presenta, con carácter general, una masa concentrada en el tope. Al determinar la frecuencia de baterías corresponde respetar su disposición específica. El proyecto interpreta la referencia a rigidez lateral como exigencia de frecuencias **horizontales X e Y** para aplicar el cálculo de fuerzas; se admite `fX>=20 Hz` y `fY>=20 Hz` independientemente, con `KhX` y `KhY` por eje.

**No se solicita ni verifica fZ.** `Kv=1` cualquiera sea la frecuencia vertical. El software no verifica rigidez vertical ni declara cumplimiento integral del artículo 87.

**Reserva normativa:** el artículo 87 no dice literalmente «solo direcciones horizontales». Esta es una interpretación de ingeniería adoptada para esta calculadora, apoyada en la referencia al artículo 122.4.iii, **no** una aclaración vinculante de la CNE. El responsable del proyecto debe evaluar su admisibilidad cuando corresponda.

## Anexo Técnico CNE artículos 87 y 88

- `IE` se obtiene de la clasificación del equipo eléctrico general en Tabla 4 y es **1** para las rutas actuales; no se recibe un número libre.
- El caso de piso superior utiliza factores de ubicación del Art. 83 únicamente donde su supuesto es aplicable. No se interpretan automáticamente bastidores ni zócalos como pisos.
- En Art. 88 se adopta `A0/g=0,50`, amortiguamiento `xi=2 %`, `R=1` para la celda. La Tabla 4 informativa contiene valores de otros elementos que **no se aplican** como reducción del equipo.
- El modelo vertical V1 rígido o V2 no rígido se elige expresamente en cada sesión. La calculadora no determina por sí sola qué modelo corresponde; debe acreditarse fuera de ella.
- Condiciones de suelo o espectros especiales fuera de los procedimientos modelados requieren revisión externa; no extrapolar el cálculo a Art. 89.

## Presentación

Cálculo interno con precisión completa; pantalla/PDF: entradas, factores esenciales, fuerzas; TXT: fórmulas y resultados consecutivos sin sustituciones, hasta tres decimales en coeficientes calculados, fuerzas con un decimal en kgf, punto por defecto o coma elegida explícitamente desde la aplicación, sin separador de miles en pantalla, PDF ni TXT. Un HTML en navegador no obtiene de forma fiable la preferencia personalizada de Windows/Excel.

Referencias: [Anexo Técnico CNE, artículos 87 y 122.4.iii](https://www.cne.cl/wp-content/uploads/2025/01/AT-Requisitos-Sismo.pdf); NCh2369:2025 §§5.7 y 7.2–7.3.

## Reservas de la auditoría (23-11-2026)

- **NCh2369 §5.8 — advertencia de alcance:** existe un procedimiento particular para equipos rígidos apoyados en suelo (`T<0,06 s`; `Kp=1` y vertical `0,7 Fh`) que esta aplicación no implementa. La selección «Nivel basal» no basta para decidir si corresponde ese procedimiento o la ruta §7.2. La elección queda a cargo del ingeniero.
- **NCh2369 §7.3 — decisión técnica cerrada:** la amplificación de anclajes por `0,7Rp` o `Rp` se aplica a **Ex y Ey**, no a **Ez**. El responsable del proyecto indicó que este criterio fue aclarado por participantes en la elaboración de la norma; no hay una referencia pública verificada que permita presentarlo como pronunciamiento oficial. Se conserva `Ez,a=Ez`, sin bloquear la liberación por esta observación.
- **CNE Art. 19:** el espectro aplicado es válido para suelos A–D; Art. 20 exige tratamiento especial fuera de ese ámbito. La app no identifica el suelo y el usuario debe verificarlo externamente.
- **NCh2369 §7.1:** cuando la estructura sismorresistente es parte integral del equipo, el diseño se remite a cláusula 5 y no se cubre automáticamente con este calculador de cargas para elementos secundarios.

## Clasificación del sistema de anclaje (actual)

Las opciones principales son: `8.5` (sistema dúctil que cumple §8.5), `7.3.2` (material dúctil que no satisface §8.5) y `7.3.3` (material no dúctil). El usuario selecciona la ruta o utiliza un asistente de cinco declaraciones «Cumple / No cumple / No verificado» (detallamiento, corte, grout/fricción, capacidad de elementos no fusibles y fundación). La definición de material exige verificar su alargamiento según §8.2.3.

El asistente solo **sugiere** una ruta. Aplicarla requiere acción expresa; no se realizan comprobaciones resistentes ni se presume conformidad por rellenar el cuestionario. Las respuestas se registran en TXT/PDF. En la selección `8.5` el motor utiliza clasificación dúctil para obtener las acciones del equipo, pero las demandas de anclajes de §7.3.2 **no se muestran ni exportan**, ya que no existe cálculo para §8.5. Las rutas `7.3.2` y `7.3.3` conservan las ecuaciones actuales, con `Ez,a=Ez`.
