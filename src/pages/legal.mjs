import { html, displayPhone } from '../templates/html.mjs';
import { todo, valueOrTodo } from '../templates/components.mjs';

const DRAFT_NOTICE = html`<div class="alert alert--warning" role="note">
  <p class="alert__title">Document à compléter et à faire valider</p>
  <p>
    Ce texte est un <strong>modèle de départ</strong>. Chaque repère « À COMPLÉTER » doit être renseigné par l’éditeur du
    site, puis l’ensemble relu par un professionnel du droit. Il ne constitue ni un avis juridique ni une garantie de
    conformité.
  </p>
</div>`;

export const legalNotice = {
  path: '/mentions-legales/',
  title: 'Mentions légales',
  description: 'Mentions légales du site MotoBoost : éditeur, hébergeur, propriété intellectuelle (modèle à compléter).',
  render(ctx) {
    const { legal, contact, brand } = ctx.config;
    return html`
      <section class="page-hero" aria-labelledby="page-title">
        <div class="container">
          <p class="eyebrow">Informations légales</p>
          <h1 class="page-title" id="page-title">Mentions légales</h1>
        </div>
      </section>
      <section class="section">
        <div class="container container--narrow prose">
          ${ctx.isProd ? '' : DRAFT_NOTICE}

          <h2>Éditeur du site</h2>
          <ul>
            <li>Nom ou dénomination : ${valueOrTodo(legal.publisherName, 'nom ou dénomination sociale de l’éditeur')}</li>
            <li>Forme juridique : ${valueOrTodo(legal.legalForm, 'forme juridique')}</li>
            <li>Immatriculation (SIREN / SIRET / RCS / RM) : ${valueOrTodo(legal.registration, 'numéro d’immatriculation')}</li>
            <li>TVA : ${valueOrTodo(legal.vatMention, 'numéro de TVA ou mention applicable')}</li>
            <li>Adresse : ${valueOrTodo(legal.address, 'adresse de l’éditeur')}</li>
            <li>
              E-mail :
              ${contact.email ? html`<a href="mailto:${contact.email}">${contact.email}</a>` : todo('e-mail de contact')}
            </li>
            ${contact.phone ? html`<li>Téléphone : ${displayPhone(contact.phone)}</li>` : ''}
            <li>Directeur de la publication : ${valueOrTodo(legal.publicationDirector, 'directeur ou directrice de la publication')}</li>
          </ul>
          <p>Nom commercial utilisé sur le site : ${brand.name}.</p>

          <h2>Hébergeur</h2>
          <ul>
            <li>Nom : ${valueOrTodo(legal.hostName, 'nom de l’hébergeur')}</li>
            <li>Adresse : ${valueOrTodo(legal.hostAddress, 'adresse de l’hébergeur')}</li>
            <li>Téléphone : ${valueOrTodo(legal.hostPhone && displayPhone(legal.hostPhone), 'téléphone de l’hébergeur')}</li>
          </ul>

          <h2>Propriété intellectuelle</h2>
          <p>
            Les textes, le logo et les éléments graphiques de ce site sont la propriété de l’éditeur, sauf mention
            contraire. ${valueOrTodo(legal.reuseTerms, 'conditions de réutilisation des contenus')}
          </p>
          <p>
            La police de caractères Barlow Condensed est diffusée sous licence SIL Open Font License 1.1 (copie du texte
            de licence fournie avec le code du site).
          </p>

          <h2>Données personnelles</h2>
          <p>
            Le traitement des informations transmises via le formulaire est décrit dans la
            <a href="${ctx.url('/confidentialite/')}">politique de confidentialité</a>.
          </p>

          <h2>Responsabilité et liens externes</h2>
          <p>
            ${valueOrTodo(legal.liabilityText, 'clause de responsabilité et liens externes')}
          </p>
        </div>
      </section>
    `;
  },
};

export const privacy = {
  path: '/confidentialite/',
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité du site MotoBoost : données du formulaire, finalités, droits (modèle à compléter).',
  render(ctx) {
    const { contact, legal } = ctx.config;
    const email = contact.email
      ? html`<a href="mailto:${contact.email}">${contact.email}</a>`
      : todo('e-mail de contact pour les demandes relatives aux données');
    return html`
      <section class="page-hero" aria-labelledby="page-title">
        <div class="container">
          <p class="eyebrow">Informations légales</p>
          <h1 class="page-title" id="page-title">Politique de confidentialité</h1>
        </div>
      </section>
      <section class="section">
        <div class="container container--narrow prose">
          ${ctx.isProd ? '' : DRAFT_NOTICE}

          <h2>Qui est responsable de vos données&nbsp;?</h2>
          <p>
            ${valueOrTodo(legal.publisherName, 'identité du responsable de traitement')}, éditeur du site
            ${ctx.config.brand.name}. Contact pour toute question sur vos données&nbsp;: ${email}.
          </p>

          <h2>Quelles données sont collectées&nbsp;?</h2>
          <p>Uniquement celles que vous saisissez dans le formulaire de contact&nbsp;:</p>
          <ul>
            <li>nom et prénom, nom de l’entreprise ou de l’enseigne, type d’activité&nbsp;;</li>
            <li>adresse e-mail&nbsp;;</li>
            <li>téléphone et adresse de votre site ou de votre fiche Google (facultatifs)&nbsp;;</li>
            <li>l’offre qui vous intéresse et votre message (facultatif).</li>
          </ul>
          <p>
            Le formulaire transmet aussi un horodatage technique (l’heure d’affichage de la page) utilisé pour limiter
            les envois automatisés. Un champ invisible, jamais transmis, sert de piège aux robots.
          </p>

          <h2>Pourquoi&nbsp;?</h2>
          <p>
            Pour répondre à votre demande de mini-audit ou d’information sur les offres.
            ${legal.extraPurposes}
          </p>
          <p>
            Base légale&nbsp;: ${valueOrTodo(legal.legalBasis, 'base légale du traitement, à déterminer avec un professionnel du droit')}
          </p>

          <h2>Qui reçoit ces données&nbsp;?</h2>
          <p>
            L’éditeur du site, ainsi que les prestataires techniques qui permettent l’envoi et la réception du
            formulaire et l’hébergement du site&nbsp;: ${valueOrTodo(legal.processors, 'nom du service de formulaire et de l’hébergeur')}.
          </p>

          <h2>Combien de temps&nbsp;?</h2>
          <p>${valueOrTodo(legal.retention, 'durée de conservation des demandes')}</p>

          <h2>Transferts hors de l’Union européenne</h2>
          <p>${valueOrTodo(legal.transfers, 'transferts de données hors UE éventuels et garanties associées')}</p>

          <h2>Vos droits</h2>
          <p>
            Vous pouvez demander l’accès à vos données, leur rectification, leur effacement, la limitation du traitement
            ou vous y opposer, et, selon les cas, demander leur portabilité. Écrivez à ${email}. Vous pouvez aussi
            introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr">cnil.fr</a>).
          </p>

          <h2>Cookies et traceurs</h2>
          <p>
            Dans sa version actuelle, ce site ne contient ni outil de mesure d’audience, ni publicité, ni police de
            caractères chargée depuis un service externe, ni vidéo ou carte intégrée. Le code du site ne dépose aucun
            cookie. Le formulaire garde seulement, dans la mémoire de session de votre navigateur, l’heure du dernier
            envoi afin de limiter les envois répétés : cette information n’est pas transmise et disparaît à la
            fermeture de l’onglet. L’hébergeur peut conserver des journaux techniques de connexion&nbsp;:
            ${valueOrTodo(legal.hostLogs, 'journaux techniques conservés par l’hébergeur')}. Cette section doit être revue dès qu’un outil
            est ajouté.
          </p>

          <h2>Mise à jour</h2>
          <p>Dernière mise à jour&nbsp;: ${valueOrTodo(legal.lastUpdate, 'date de mise à jour')}</p>
        </div>
      </section>
    `;
  },
};
