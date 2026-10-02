# Iconos de tecnologías

La biblioteca usa 33 SVG locales en `public/icons/technologies/`. Su equivalente embebido en `js/modules/technology-icons.js` permite exportar SVG y PNG sin depender de una red o de un CDN. La interfaz mantiene texto accesible junto a cada icono.

## Procedencia

| Componentes | Procedencia | Referencia |
| --- | --- | --- |
| AWS, GitHub, GitLab, Kubernetes, Docker, Terraform, Jenkins, n8n, Kafka, Redis, PostgreSQL, MongoDB, RabbitMQ, Grafana, Prometheus y OpenTelemetry | Colección SVG Logos de Iconify (CC0) | https://icon-sets.iconify.design/logos/ |
| ArgoCD y Loki | Devicon (MIT) | https://github.com/devicons/devicon |
| Backstage | Simple Icons (CC0) | https://simpleicons.org/ |
| GCP | Iconos GCP en Iconify (Apache 2.0) | https://icon-sets.iconify.design/gcp/ |
| Azure | Microsoft Azure Architecture Icons | https://learn.microsoft.com/azure/architecture/icons/ |
| Port | Icono del plugin oficial de Port (MIT) | https://github.com/port-labs/cursor-plugin |
| Tempo | Logo oficial de Grafana Tempo | https://grafana.com/static/assets/img/logos/grafana-tempo.svg |

Los nombres y logotipos de servicios pertenecen a sus respectivos titulares. Se muestran únicamente para identificar tecnologías en diagramas de arquitectura. Los iconos oficiales de Azure se mantienen sin alterar y se usan para representar servicios Azure.

## Mantenimiento

`npm run icons` vuelve a generar los iconos provenientes de paquetes Iconify y el módulo de exportación. Los cuatro SVG de Azure, el de Port y el de Tempo se conservan como archivos locales. Al actualizar una fuente, comprueba sus condiciones de uso y vuelve a ejecutar la compilación y las pruebas.
