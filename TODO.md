# TODO

Outstanding items deferred from the main implementation track. These
do NOT block progress on the current step; revisit during the QA pass
in step 12.

## Pendientes visuales (a resolver tras paso 12 QA)

- [ ] **Disintegration shader** — efecto visual no termina de
  convencer al usuario. Probar opción "líquido sin partículas":
  quitar `yDrift`, `xJitter`, `regionDelay`, dejar solo wobble UV +
  edge tint dorado + alpha fade con curva natural. Las letras se
  evaporan en líquido, no se fragmentan. Capturar 3 screenshots y
  comparar con referencia visual del usuario.

- [ ] **Reduced-motion sanity check** — verificar que el media-query
  `prefers-reduced-motion: reduce` no esté disparando por error en
  Chrome del usuario (la rama reducida hace fade+translate sin shader,
  podría enmascarar el efecto deseado).
