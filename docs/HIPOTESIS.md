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

**Decisión FS-08, 23-11-2026.** El artículo 87 exige frecuencia equivalente mínima de 20 Hz «en cualquier dirección» y remite al artículo 122.4.iii, que define su determinación utilizando masa y **rigidez lateral** de la estructura de soporte y el equipo como masa concentrada. El proyecto interpreta esa remisión como exigencia de frecuencias **horizontales X e Y** para aplicar el cálculo de fuerzas; se admite `fX>=20 Hz` y `fY>=20 Hz` independientemente, con `KhX` y `KhY` por eje.

**No se solicita ni verifica fZ.** `Kv=1` cualquiera sea la frecuencia vertical. El software no verifica rigidez vertical ni declara cumplimiento integral del artículo 87.

**Reserva normativa:** el artículo 87 no dice literalmente «solo direcciones horizontales». Esta es una interpretación de ingeniería adoptada para esta calculadora, apoyada en la referencia al artículo 122.4.iii, **no** una aclaración vinculante de la CNE. El responsable del proyecto debe evaluar su admisibilidad cuando corresponda.

## Anexo Técnico CNE artículos 87 y 88

- `IE` se obtiene de la clasificación del equipo eléctrico general en Tabla 4 y es **1** para las rutas actuales; no se recibe un número libre.
- El caso de piso superior utiliza factores de ubicación del Art. 83 únicamente donde su supuesto es aplicable. No se interpretan automáticamente bastidores ni zócalos como pisos.
- En Art. 88 se adopta `A0/g=0,50`, amortiguamiento `xi=2 %`, `R=1` para la celda. La Tabla 4 informativa contiene valores de otros elementos que **no se aplican** como reducción del equipo.
- El modelo vertical V1 rígido o V2 no rígido se elige expresamente en cada sesión. La calculadora no determina por sí sola qué modelo corresponde; debe acreditarse fuera de ella.
- Condiciones de suelo o espectros especiales fuera de los procedimientos modelados requieren revisión externa; no extrapolar el cálculo a Art. 89.

## Presentación

Cálculo interno con precisión completa; pantalla/PDF: entradas, factores esenciales, fuerzas; TXT: fórmulas y resultados consecutivos sin sustituciones, hasta tres decimales en coeficientes calculados, fuerzas con un decimal en kgf, punto o coma decimal según configuración regional, sin separador de miles.

Referencias: [Anexo Técnico CNE, artículos 87 y 122.4.iii](https://www.cne.cl/wp-content/uploads/2025/01/AT-Requisitos-Sismo.pdf); NCh2369:2025 §§5.7 y 7.2–7.3.
