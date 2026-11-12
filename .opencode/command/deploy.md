---
description: Despliega Dentistes en producción abriendo el host solo durante la operación.
agent: public-web
---

Despliega el sitio público y el resto de la plataforma Dentistes en producción.

1. Carga y sigue la skill `host-ops` de `../host/skills/host-ops/SKILL.md`.
2. Comprueba el estado:
   ```bash
   /Users/eric/Workspace/host/hostctl status
   ```
3. Abre una sesión de trabajo de 8 horas:
   ```bash
   /Users/eric/Workspace/host/hostctl session start
   ```
4. Verifica que el clúster responde con el kubeconfig correcto:
   ```bash
   kubectl --kubeconfig "$HOME/.kube/config-161" -n dentistes get deploy,pods
   ```
   No uses `~/.kube/config-percepta-agents`.
5. Despliega:
   ```bash
   KUBECONFIG="$HOME/.kube/config-161" ./deploy/deploy.sh
   ```
6. Verifica:
   ```bash
   KUBECONFIG="$HOME/.kube/config-161" kubectl -n dentistes rollout status deployment/marketing --timeout=120s
   curl -I https://dentistes.2mes4.com/
   ```
   Comprueba en el HTML servido que los CTA apuntan a `https://app.dentistes.2mes4.com/signup`, que `/en/` y `/ca/` cargan y que una URL inexistente devuelve el `404.html`.
7. Cierra la sesión:
   ```bash
   /Users/eric/Workspace/host/hostctl session stop
   ```
8. Si algo falla, no dejes los puertos abiertos y reporta el error exacto.

No reinicies el host, no desactives `PasswordAuthentication` y no expongas `10250`, `2379` ni `2380`.
