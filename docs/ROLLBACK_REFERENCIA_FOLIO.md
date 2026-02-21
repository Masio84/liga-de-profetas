# Rollback operativo (Referencia/Folio)

Este runbook sirve para **revertir rápido** el cambio de referencia por folio si detectas error al publicar.

## 1) Revertir commit en Git (sin reescribir historia)

1. Identifica el commit a revertir:

```bash
git log --oneline -n 10
```

2. Reviértelo:

```bash
git revert <SHA_DEL_COMMIT>
```

3. Publica el revert:

```bash
git push origin <tu-rama>
```

> Si el cambio ya estaba en `main`, haz el `revert` en `main` (o vía PR) para dejar rastro limpio.

---

## 2) Rollback inmediato en Vercel (si ya está en producción)

### Opción A: desde dashboard (rápida)
1. Ir a **Vercel → Project → Deployments**.
2. Elegir el deployment estable anterior.
3. Click en **Promote to Production**.

### Opción B: con CLI

```bash
vercel rollback <deployment-url-o-id>
```

> Esto devuelve producción al build anterior mientras se corrige el código.

---

## 3) Verificación post-rollback

Validar estos puntos:
- La página carga sin errores JS visibles en consola.
- Se puede registrar una participación.
- El ticket PDF se genera correctamente.
- El endpoint `POST /api/participaciones` responde 200.

Chequeo rápido de salud:

```bash
curl -sS https://<tu-dominio>/api/health
```

---

## 4) Estrategia recomendada (segura)

1. **Rollback de deployment** en Vercel (recuperación inmediata).
2. **Revert en Git** del commit problemático (alinear código con producción).
3. Abrir PR de corrección con pruebas antes de volver a promover.

