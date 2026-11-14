# **Especificació de Contingut i UX: Secció de Compliment Fiscal Regional per a la Web de Vendes**

# **1\. Objectiu i Proposta de Valor per a la Web Pública**

Eliminar la incertesa legal i fiscal dels odontòlegs titulars i directors de clínica abans que iniciïn el període de prova. La secció de Compliment Fiscal i Normatiu Regional de la web de vendes (dentistes.2mes4.com) adapta dinàmicament el missatge segons la ubicació geogràfica del visitant (o la selecció manual del desplegable de país), mostrant amb absoluta transparència:

* Com s'adapta el programari a la llei tributària i sanitària del seu país.  
* Si la facturació electrònica oficial està **activa des del primer dia** o es troba en **fase d'integració (llista d'espera prioritària)** mentre s'utilitzen rebuts i pressupostos interns sense cost addicional.

# **2\. Arquitectura UX i Comportament Dinàmic del Component**

## **2.1. Ubicació a la Pàgina**

* **Posició a la Landing Page:** Immediatament després del bloc de Funcionalitats Clíniques (Agenda, Odontograma, Història Clínica) i abans de la Taula de Preus (Tarifa Plana), actuant com a reductor d'objeccions legals just abans de la decisió de compra.  
* **Sincronització Global:** El selector de país d'aquesta secció està sincronitzat amb el selector de divisa de la capçalera i la taula de tarifes. Si l'usuari canvia de *Espanya* a *Mèxic* o *Colòmbia*, s'actualitzen simultàniament la moneda (`EUR` / `MXN` / `USD`) i la fitxa normativa d'aquesta secció.

## **2.2. Estructura Visual de la Targeta Normativa**

La secció consta d'una capçalera comuna i una **Targeta Dinàmica de País** dividida en tres blocs:

* **Capçalera General de Secció:**  
  * **Titular (H2):** Adaptat a la normativa fiscal i sanitària del teu país. Sense mòduls de pagament sorpresa.  
  * **Subtitular:** Selecciona la teva ubicació per veure com gestionem la facturació electrònica, els codis QR oficials i la privacitat dels teus pacients.  
* **Cos de la Targeta Dinàmica:**  
  1. **Indicador d'Estat (Badge Visual):**  
     * Verd (`ACTIU I INCLÒS EN LA TARIFA PLANA`): Per a països d'atac directe (Espanya, Colòmbia, Xile, Argentina, etc.).  
     * Ambre (`PROPERAMENT - LLISTA D'ESPERA OBERTA`): Per a països pendents de certificador local (Mèxic, Perú, Panamà, Guatemala).  
  2. **Detall Normatiu i Operatiu (3 punts clau per al dentista):** Explica en llenguatge planer què fa el programari a nivell de facturació, impostos i historial legal.  
  3. **Crida a l'Acció (CTA) Contextual:**  
     * En estat *Actiu*: *"Comença els teus 30 dies gratis amb facturació \[Nom Sistema\] inclosa"*.  
     * En estat *Properament*: *"Utilitza l'agenda i l'odontograma gratis 30 dies i apunta't a l'accés prioritari de \[Nom Sistema\]"*.

| Estat del País | Badge Visual | Tipus de CTA | Objectiu Conversió |
| :---- | :---- | :---- | :---- |
| **Atac Directe** | Verd (`ACTIU`) | Directe a registre de prova | Alta immediata amb facturació oficial |
| **Integració Pendent** | Ambre (`PROPERAMENT`) | Prova \+ Llista prioritària | Validació de demanda i captura de lead |
| **Transició / Altres** | Neutre (`MODE GESTIÓ INTERNA`) | Prova de gestió clínica | Ús operatiu immediat sense blocatges |

# **3\. Contingut i Copywriting Específic per País / Jurisdicció**

## **3.1. Espanya (Estat: ACTIU \- Atac Directe)**

* **Badge:** `ACTIU · Adaptat a la Llei Antifrau (VeriFactu i TicketBAI)`  
* **Titular de la Fitxa:** Facturació legal amb codi QR per a Hisenda sense quotes d'actualització.  
* **Punts Clau per al Dentista:**  
  * **Compliment VeriFactu i TicketBAI inclòs:** Emet factures amb encadenament de seguretat i codi QR verificable sense pagar mòduls extra ni manteniments abusius.  
  * **Exempt d'IVA sanitari per defecte:** Configurat per a tractaments odontològics exempts i gestió automàtica d'IVA en tractaments estètics o productes.  
  * **Història clínica inalterable i RGPD sanitari:** Evolutius protegits davant inspeccions i permisos diferenciats entre recepció i doctors.  
* **CTA:** Prova-ho 30 dies gratis a la teva clínica

## **3.2. Colòmbia (Estat: ACTIU \- Atac Directe)**

* **Badge:** `ACTIU · Facturació Electrònica DIAN + RIPS`  
* **Titular de la Fitxa:** Factura electrònicament davant la DIAN i genera els RIPS de salut en segons.  
* **Punts Clau per al Dentista:**  
  * **Connexió directa amb la DIAN (CUFE i QR):** Emet Factures Electròniques de Venta validades amb el certificat digital de la teva clínica, sense intermediaris cars.  
  * **Suport per a RIPS del sector salut:** Dades estructurades llestes per a la reportabilitat obligatòria de prestadors de serveis odontològics.  
  * **Control de NIT, Cèdula i cartera de pacients:** Validació automàtica de dades fiscals del pacient i seguiment de pagaments per quotes de tractament.  
* **CTA:** Comença els teus 30 dies gratis a Colòmbia

## **3.3. Mèxic (Estat: PROPERAMENT / LLISTA D'ESPERA)**

* **Badge:** `PROPERAMENT · Integració CFDI 4.0 (SAT) en preparació`  
* **Titular de la Fitxa:** Gestiona avui tota la teva clínica i reserva accés prioritari al timbrat CFDI 4.0.  
* **Punts Clau per al Dentista:**  
  * **Operativa clínica 100% activa avui:** Utilitza l'agenda multigabinet, l'odontograma, el control de caixa diària i els rebuts/pressupostos per als teus pacients des del primer minut.  
  * **Timbrat CFDI 4.0 (SAT) en integració:** Estem finalitzant la connexió de timbrat automàtic amb RFC, Règim Fiscal i ús de CFDI (`D01` Honoraris dentals) inclòs dins la tarifa plana.  
  * **Accés prioritari sense pujada de preu:** Les clíniques que s'incorporin ara mantenen la seva tarifa plana congelada quan s'activi el timbrat oficial.  
* **CTA:** Prova 30 dies gratis i uneix-te a la llista prioritària CFDI

## **3.4. Perú (Estat: PROPERAMENT / LLISTA D'ESPERA)**

* **Badge:** `PROPERAMENT · Comprovants Electrònics SUNAT en preparació`  
* **Titular de la Fitxa:** Controla els teus gabinets avui i activa pròximament l'emissió de Boletes i Factures SUNAT.  
* **Punts Clau per al Dentista:**  
  * **Gestió integral de consultori activa:** Agenda, història clínica, alertes mèdiques i control de saldos pendents llestos per operar immediatament.  
  * **Boleta de Venta (DNI) i Factura Electrònica (RUC):** Estem integrant l'emissió electrònica amb validesa SUNAT i codi QR oficial.  
  * **Tarifa plana garantida:** Comença sense friccions i activa la facturació electrònica tan bon punt estigui disponible al teu compte.  
* **CTA:** Prova 30 dies gratis i sol·licita avís per a SUNAT

## **3.5. Resta de Llatinoamèrica \- Atac Directe (Xile, Argentina, Costa Rica, Equador, Uruguai, Rep. Dominicana, El Salvador)**

* **Badge:** `ACTIU · Adaptat a Facturació Electrònica Local`  
* **Titular de la Fitxa:** Compliment tributari directe amb el certificat digital de la teva clínica.  
* **Punts Clau per al Dentista:**  
  * **Connexió directa amb l'entitat tributària:** Compatibilitat amb DTE (SII Xile), Factura Electrònica CAE (ARCA Argentina), Comprovants Electrònics (SRI Equador / MH Costa Rica) i CFE (DGI Uruguai).  
  * **Identificadors fiscals locals preconfigurats:** Formularis adaptats automàticament a RUT, CUIT, RUC o Cèdula segons el país de la clínica.  
  * **Un sol preu per a tot l'equip:** Sense cobrar per doctor col·laborador ni per volum de cites.  
* **CTA:** Comença els teus 30 dies gratis

## **3.6. Altres Països en Transició (Panamà, Guatemala, Bolívia, Paraguai, Brasil, etc.)**

* **Badge:** `MODE GESTIÓ INTERNA · Facturació fiscal properament`  
* **Titular de la Fitxa:** Digitalitza la teva clínica amb pressupostos i rebuts interns mentre integrem el connector fiscal local.  
* **Punts Clau per al Dentista:**  
  * **Totes les eines clíniques disponibles:** Agenda, odontograma, història clínica digital, consentiments i arqueig de caixa diària operatius des del dia 1\.  
  * **Emissió de pressupostos i rebuts personalitzats:** Lliura comprovants detallats amb el logotip de la teva clínica al pacient.  
  * **Priorització per demanda:** Indica el teu país en registrar-te per prioritzar l'activació de la facturació electrònica local (SFEP, FEL, SIAT, SIFEN, NFS-e).  
* **CTA:** Prova el programari 30 dies gratis

# **4\. Micro-interaccions i Captura de Demanda (Llista d'Espera)**

## **4.1. Flux d'Interacció Secundari**

En països amb estat `PROPERAMENT` (com Mèxic o Perú), si el dentista no vol iniciar encara la prova completa de 30 dies però desitja rebre una notificació en el moment exacte en què s'activi el timbrat o l'emissió electrònica oficial, s'ofereix un enllaç secundari d'alta conversió situat immediatament sota el botó principal d'acció:*"Només m'interessa quan tingueu CFDI / SUNAT actiu. Aviseu-me."*

## **4.2. Campanya i Recull de Dades**

En fer clic a aquest enllaç, s'obre un modal lleuger d'un sol pas dissenyat per no generar fricció.

* **Camps de captura del formulari:**  
  1. Correu electrònic professional.  
  2. Nom de la clínica o consultori.  
  3. País (preseleccionat segons context).  
  4. Número de gabinets (permetre priorització per volum de clínica).  
* **Funció Operativa:** Aquesta informació s'integra automàticament al quadre de comandament de desenvolupament, alimentant directament l'indicador de demanda real per establir l'ordre de prioritat en la signatura d'acords amb proveïdors fiscals i certificadors locals.

