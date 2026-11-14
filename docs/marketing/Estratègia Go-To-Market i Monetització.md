# **Pla Estratègic de Validació, Monetització i Go-To-Market (GTM)**

**Plataforma SaaS Lleugera per a Clíniques Dentals Independents**  
*Complement estratègic a la [Guia d'Implementació Tècnica](https://docs.google.com/document/d/1ISBBpufHdXNXzY0-bBKGHqcyfe6-6flihTsqSr7J9K4/edit)*

# **1\. Resum Executiu i Proposta de Valor Única**

## **1.1 El buit de mercat (Market Gap)**

El sector del programari per a clíniques dentals a Espanya i Catalunya pateix d'hipertròfia de funcionalitats ("software bloat"): programes heretats de fa més de vint anys que requereixen servidors locals o interfícies al núvol lentes, complexes i amb corbes d'aprenentatge feixugues. Les clíniques petites i mitjanes (1 a 3 gabinets) necessiten una eina que faci el 20% de les accions que resolen el 80% del dia a dia amb una velocitat instantània.

## **1.2 La nostra proposta de valor**

* **Velocitat extrema i simplicitat radical**: Interfície SPA reactiva i backend lleuger en Go sobre PostgreSQL amb Row-Level Security (RLS). Carrega en menys d'un segon i permet registrar una cita o atendre un pacient en menys de 3 clics.  
* **Automatització intel·ligent amb WhatsApp (Agent Mastra)**: Reducció directa del 30-40% en cites no presentades (no-shows) sense sobrecarregar la recepció, enviant confirmacions interactives i recordatoris directes per l'API oficial de WhatsApp.  
* **Transparència i cost zero de fricció**: Sense quotes d'instal·lació ocultes, sense permanència i amb un model multi-tenant que permet activar una clínica nova en menys de 5 minuts.

# **2\. Benchmark de Competidors i Posicionament de Mercat**

Comparativa basada en dades de mercat i anàlisis del sector ([Dentasys](https://www.dentasys.es/ca/millors-programes-clinica-dental), [Docfav](https://pro.docfav.com/blog/mejores-software-clinicas-dentales), [Updent](https://updent.es/blog/software-gestion-dental-comparativa/)):

| Solució | Model i Preu Orientatiu | Punts Forts | Punts Febles / Fricció | Posicionament respecte a nosaltres |
| :---- | :---- | :---- | :---- | :---- |
| **Gesden (Infomed)** | Líder tradicional; cost elevat (llicències \+ manteniment / Gesden One) | Alta implantació (\>14.000 clíniques), integració radiològica profunda | Arquitectura heretada feixuga, interfície complexa, costos de manteniment alts | Monòlit per a grans clíniques; massa car i lent per a consultes petites |
| **Clinic Cloud** | SaaS al núvol; 29 € \- 79 €/mes \+ IVA (mòdul dental només en pla Max) | Interfície web coneguda, integració amb Doctoralia | Odontograma limitat als plans alts, costos que creixen per mòduls | Generalista mèdic que encareix les eines dentals bàsiques |
| **Nubimed** | SaaS al núvol; des de 27,40 € a 50,10 €/mes \+ suplements per facultatiu | Versàtil, comunicació per WhatsApp integrada bàsica | Interfície poc especialitzada, límit d'usuaris i mòduls addicionals | Eina genèrica de salut; no explota l'agent intel·ligent de WhatsApp |
| **Klinikare** | SaaS modern al núvol (AWS); preu no publicat (pressupost a mida) | Disseny visual modern, completesa clínica | Preu opac, enfocat a clíniques mitjanes-grans o cadenes | Barrera d'entrada alta per a odontòlegs independents |
| **Dentasys** | SaaS al núvol; \~80 €/mes \+ IVA per clínica amb usuaris il·limitats | Tot inclòs, assistent IA i WhatsApp oficial | Enfocament recent, preu únic fix que pot ser elevat per a clíniques d'1 sol gabinet | Competidor més proper en enfocament modern, però nosaltres competim en hiper-simplicitat i preu d'entrada |
| **La Nostra Solució** | SaaS lleuger; **49 € \- 79 €/mes** sense mòduls ni costos d'alta | Backend Go instantani, configuració en 5 min, agent WhatsApp Mastra natiu | Menor ventall de mòduls avançats (comptabilitat complexa, imatgeria 3D avançada) | L'alternativa àgil, intuïtiva i assequible per a clíniques independents |

## **Oportunitat Clau (El Sweet Spot)**

Captar les més de 25.000 clíniques dentals independents d'Espanya (i més de 4.500 a Catalunya) que estan cansades de pagar centenars d'euros al mes per un programari del qual només utilitzen l'agenda, les dades de contacte i la fitxa bàsica del pacient.

# **3\. Fase 1: Pla de Validació amb Clíniques Locals (Inici: Setmana Vivent)**

Per transformar les 2 clíniques amigues en els primers casos d'èxit ("Design Partners"), s'executarà un programa de proves pilot controlat de 3 setmanes:

## **3.1 Objectius de la Validació**

1. **Validar la usabilitat central**: La recepcionista i l'odontòleg han de poder crear, moure i finalitzar una cita en menys de 15 segons sense rebre formació prèvia de més de 10 minuts.  
2. **Validar l'impacte de l'Agent WhatsApp Mastra**: Comprovar que el missatge automàtic de recordatori i confirmació redueix les absències i que els pacients responen amb fluïdesa.  
3. **Identificar "Showstoppers"**: Detectar mancances crítiques (p. ex., camps obligatoris per a la recepta, format del número de telèfon o impressió de consentiments LOPDGDD).

## **3.2 Cronograma setmana a setmana**

* **Setmana 1 (Desplegament i Observació)**:  
  * Instal·lació/creació del tenant per a la Clínica A i la Clínica B.  
  * Sessió d'observació presencial (Shadowing) de 2 hores a la recepció en hora punta per veure com gestionen l'agenda en paral·lel.  
  * Entrada de dades pilot (10-20 pacients reals del dia).  
* **Setmana 2 (Proves de l'Agent WhatsApp i Flux Diari)**:  
  * Activació dels recordatoris automàtics de WhatsApp via Mastra per a les cites de l'endemà.  
  * Registre de respostes dels pacients (Confirmació, Cancel·lació, Reprogramació).  
  * Recollida de friccions: Què ha costat trobar? Quants clics han calgut?  
* **Setmana 3 (Avaluació i Conversió)**:  
  * Entrevista estructurada de tancament amb el titular de la clínica i la persona de recepció.  
  * Càlcul de l'índex de satisfacció (SUS \- System Usability Scale) i estalvi de temps estimat.  
  * Petició formal de testimoni/recomanació i proposta de tancar-los com a clients de pagament fundadors (Founder Clinic Plan).

## **3.3 Formulari de Feedback i Mètriques d'Èxit (KPIs de Validació)**

* **Time-to-Action**: Temps mitjà per donar una nova cita (objectiu: \< 20 segons).  
* **Taxa de Confirmació WhatsApp**: Percentatge de pacients que confirmen via bot (objectiu: \> 70%).  
* **NPS o Disposició a Pagar**: Resposta afirmativa a la pregunta: *"Si aquest sistema costés 49 €/mes, el mantindries per substituir la feina manual de recepció?"*.

# **4\. Model de Monetització i Preus (Pricing Architecture)**

Per monetitzar ràpidament sense crear barreres de venda, s'estableix una estructura de preus senzilla i predictible:

## **4.1 Plans de Subscripció Mensual (SaaS)**

* **Pla Basic (39 € / mes \+ IVA)**:  
  * Gestió d'agenda multi-gabinet i calendari visual.  
  * Fitxes de pacients, historial d'intervencions bàsic i alertes mèdiques.  
  * Usuaris il·limitats (recepció, higienista, odontòleg).  
  * Recordatoris bàsics de cites.  
* **Pla Pro \- Smart Practice (69 € / mes \+ IVA)** *(Pla Recomanat)*:  
  * Totes les funcionalitats del Pla Basic.  
  * **Agent WhatsApp Mastra complet**: Confirmació bidireccional automàtica, cancel·lacions en temps real i gestió intel·ligent de buits a l'agenda.  
  * Compliment automatitzat RGPD (enviament de consentiment per signatura digital via WhatsApp/SMS).  
  * Suport prioritari per xat/WhatsApp.  
* **Pla Founder (Ofert als primers 15 clients)**:  
  * 49 € / mes per a tota la vida per al Pla Pro a canvi d'oferir testimonis en vídeo, cas d'estudi i feedback trimestral.

## **4.2 Economia de la Unitat (Unit Economics)**

* **Cost d'infraestructura marginal per clínica**: Gràcies a Go i PostgreSQL compartit amb RLS a servidors com Hetzner o AWS, el cost computacional per clínica és inferior a **2-3 €/mes** (incloent-hi l'execució de l'agent Mastra).  
* **Cost de l'API de WhatsApp Cloud**: Aproximadament 0,03 € a 0,05 € per conversa iniciada per l'empresa. Per a una clínica amb 300 cites/mes, el cost de missatgeria és d'uns 9-12 €/mes.  
* **Marge Brut Estimador**: \> 75% en el Pla Pro, cosa que permet un flux de caixa positiu des del primer moment.

# **5\. Estratègia Go-To-Market i Pla de Promoció ("Com fer que sigui un Boom")**

Per assolir un creixement accelerat sense necessitat d'inversions milionàries inicials, es combinarà la venda directa hiperlocal amb motors de creixement orgànic i col·laboracions estratègiques.

## **5.1 Fase de Tracció Inicial: Del 0 als 20 clients (Mes 1 \- Mes 2\)**

* **Venda de guerrilla local (Door-to-door & Trucada càlida)**:  
  * Visitar en persona les clíniques del Garraf, Alt Penedès i Baix Llobregat amb una demo mòbil interactiva (mostrar l'agenda al mòbil i com el bot de WhatsApp interactua en directe en 60 segons).  
  * Oferta irresistible: 30 dies de prova sense targeta i sense compromís, amb importació gratuïta dels seus pacients des d'un fitxer Excel/CSV.  
* **El canal secret: Representants de laboratoris protètics i dipòsits dentals**:  
  * Els protètics i comercials de material dental visiten 10-15 clíniques cada setmana i tenen la màxima confiança dels odontòlegs.  
  * Acord d'afiliació/prescripció: Oferir-los una comissió recurrent del 20% mensual per cada clínica que contracti el sistema a través d'ells.

## **5.2 Fase d'Escalabilitat: Dels 20 als 100+ clients (Mes 3 \- Mes 6\)**

* **Marketing de Continguts i Comparatives**:  
  * Creació de pàgines d'aterratge específiques de comparativa: *"L'alternativa senzilla i ràpida a Gesden i Clinic Cloud"*.  
  * Calculadora d'estalvi de temps i diners per a la recepció de la clínica dental.  
* **Product-Led Growth (Efecte Xarxa Pacient-Clínica)**:  
  * Cada missatge de WhatsApp enviat al pacient pot portar un peu discret: *"Recordatori gestionat amb DentalApp \- El software dental més ràpid"*. Molts pacients o familiars són professionals sanitaris o emprenedors que coneixen altres metges.  
* **Publicitat Digital Segmentada**:  
  * Campanyes de Meta Ads (Facebook/Instagram) i LinkedIn adreçades específicament a "Titulars de Clínica Dental", "Odontòlegs autònoms" i "Higienistes dentals" a Catalunya i Espanya, amb creativitats centrades en el dolor real: *"Cansat de pagar centenars d'euros per un software que no saps fer anar?"*.

## **5.3 Necessitats d'Inversió i Decisió de Capital**

* **Escenari Bootstrapping (Sense inversors externs)**:  
  * Cost d'arrencada: \~500 € \- 1.000 € (domini, servidor cloud Hetzner, compte Meta Business verificat per a WhatsApp, material gràfic).  
  * Avantatge: Control total del negoci i rendibilitat des de la desena clínica de pagament.  
* **Escenari Accelerat (Inversió Seed de 25.000 € \- 40.000 €)**:  
  * Ús de fons: 50% adquisició de clients (anuncis de pagament \+ un comercial especialitzat a temps parcial), 30% contractació de suport/onboarding ràpid, 20% infraestructura i millores de seguretat RGPD.  
  * Recomanació: Validar primer les 5 primeres clíniques de pagament en mode *bootstrapping*; un cop validat que el CAC (cost d'adquisició) és inferior al LTV (valor del cicle de vida del client), injectar capital per escalar a escala nacional.

# **6\. Pla d'Acció Immediat a 30 Dies**

| Dies | Objectiu Clau | Acció Operativa |
| :---- | :---- | :---- |
| **Dies 1 \- 7** | Preparació i Pilot | Tancar dates amb les 2 clíniques amigues; carregar dades de prova al tenant; verificar el web hook de WhatsApp de Mastra. |
| **Dies 8 \- 14** | Validació Presencial | Estar present 1 dia a cada clínica; recollir observacions d'ús; ajustar els 3 defectes o friccions principals. |
| **Dies 15 \- 21** | Test de WhatsApp Real | Activar recordatoris automàtics reals amb pacients de les clíniques pilot; mesurar respostes. |
| **Dies 22 \- 30** | Llançament Comercial | Tancar les 2 primeres clíniques com a Pla Founder; generar la pàgina de vendes (Landing Page) amb els seus testimonis; iniciar visites a 10 noves clíniques locals. |

