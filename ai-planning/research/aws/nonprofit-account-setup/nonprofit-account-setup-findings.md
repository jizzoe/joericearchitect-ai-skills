# AWS Account Setup for a Nonprofit: Research Findings

**Research date:** 2026-08-12
**Depth:** Standard
**Status:** Decision support; no AWS account or credentials created
**Source register:** [sources.md](sources.md)

## Plain-Language Outcome

The nonprofit should own the AWS account and the recovery paths. Its leader
should not need to perform technical administration, and the engineer should
not use shared credentials or the account root user. The recommended model is
an organization-owned AWS Organizations management account, IAM Identity
Center identities for every person, and separate AWS workload accounts.

This is appropriate for the planned React Native/Expo mobile application,
Spring Boot microservices on EKS, PostgreSQL, Cognito, Textract, Polly, and
infrastructure management through Terraform, the AWS CLI, and the console.

## Verified Findings

### Account Ownership and Initial Signup

- AWS requires contact information, a reachable phone for identity verification,
  acceptance of the AWS Customer Agreement, a selected support plan, and a
  valid payment method to complete signup. [AWS account signup][aws-signup]
- For a business account, AWS recommends organization phone numbers and email
  addresses rather than an individual's details for alternate contacts.
  [AWS alternate contacts][aws-alternate-contacts]
- AWS recommends using a business-managed group email address for root user
  credentials, protecting the root user with MFA, never creating root access
  keys, and avoiding root for daily work. [AWS root-user best practices][aws-root]

**Recommendation:** Create the initial AWS account in the nonprofit's exact
legal name. Use a dedicated nonprofit-controlled root mailbox, such as
`aws-root@<nonprofit-domain>`, rather than the leader's or engineer's personal
email. Use the nonprofit's legal address and organization-owned payment method
where available. The leader remains accountable for ownership and payment; the
engineer does not receive or share the root password or root MFA device.

### Nonprofit Credits and Eligibility

- The AWS Nonprofit Credit Program is distributed through TechSoup and partner
  NGOs. AWS states that eligible U.S. organizations include specified 501(c)
  designations and certain public libraries, while educational institutions are
  excluded. [AWS nonprofit credit program][aws-nonprofit-credit]
- TechSoup enrollment requires an organization record and, for U.S.
  organizations, an EIN plus organization information such as annual operating
  budget. TechSoup performs qualification review and may request supporting
  documents. [TechSoup enrollment][techsoup-join]
- TechSoup states that an AWS application needs a valid AWS account ID whose
  Account Name identifies the organization; AWS signup still requires a credit
  card/payment method. [TechSoup AWS FAQ][techsoup-aws-faq]
- AWS TechAction is a separate U.S. program for qualified nonprofits and credit
  unions with an EIN that use AWS for donor/member engagement or fundraising.
  It requires an active AWS account and a project description. [AWS TechAction
  FAQ][aws-techaction]

**Important uncertainty:** Current AWS and TechSoup pages present inconsistent
credit amounts and offer mechanics (for example, $1,000, $2,000, and up to
$5,000). Treat credits as promotional credits, not a permanent service-price
discount, and do not base the project budget on a published amount. Confirm the
available offer, amount, administrative fee, eligibility, applicable services,
expiration, and renewal terms in the TechSoup checkout/application flow before
committing spend. Credits expire and ordinary AWS charges resume when credits
are exhausted or expired. [AWS nonprofit credit program][aws-nonprofit-credit]
[TechSoup AWS FAQ][techsoup-aws-faq]

**Owner preparation checklist:**

1. Exact legal nonprofit name, EIN, tax-exempt designation, mission summary,
   physical address, and annual operating budget.
2. Existing TechSoup organization account or authority to create and manage it.
3. Relevant tax-exemption/registration material should TechSoup request it.
4. Nonprofit-controlled root email inbox, a reachable verification phone, and
   an organization payment method.
5. A short app/project description, including whether donor/member engagement
   or fundraising is a material use case for TechAction.

### Identity, Administration, and Logins

- AWS recommends IAM Identity Center for federated human access and temporary
  credentials instead of long-lived IAM-user passwords and access keys.
  [AWS account setup][aws-account-setup] [AWS root-user best practices][aws-root]
- IAM Identity Center lets an organization grant AWS account access through
  permission sets assigned to users and groups. Group changes dynamically add
  or remove access. [IAM Identity Center users and groups][identity-center-users]
- The AWS CLI supports IAM Identity Center through `aws configure sso` and
  `aws sso login`; credentials are temporary. [AWS CLI SSO configuration][aws-cli-sso]

**Recommended initial access model:**

| Person or purpose | Identity and access |
| --- | --- |
| Nonprofit leader | Individual IAM Identity Center user, MFA, organization/billing administration only as required. |
| Engineer | Individual IAM Identity Center user, MFA, temporary administrator access during foundation setup; then scoped engineering administration in workload accounts. |
| Terraform/CI | Per-account deployment role using short-lived federation, not a human's access key. |
| Volunteers | Individual IAM Identity Center users, MFA, and group-based least-privilege access. |
| Root account | Nonprofit-controlled emergency/ownership identity only; no daily use and no shared credentials. |

**How people sign in:**

- The leader and engineer normally use their own IAM Identity Center access
  portal login and MFA.
- The engineer uses the same identity for console access and configures CLI
  profiles with `aws configure sso`, then obtains short-lived credentials with
  `aws sso login --profile <profile>`.
- Root login is only for root-only activities or recovery: choose **Root user**,
  enter the nonprofit's root email, password, and MFA. It is neither user's
  normal login.

### Account Structure for This Application

- AWS recommends that Organizations management accounts be restricted to
  organization and billing activities and that workloads run in member accounts.
  [AWS Organizations management-account best practices][org-management]
- The management account pays consolidated charges for member accounts.
  [AWS consolidated billing][consolidated-billing]

**Recommendation:** Create an AWS Organization with all features enabled,
using the nonprofit-owned initial account as the management/billing account.
Do not deploy EKS, databases, application resources, or user data there.
Create at minimum:

| AWS account | Purpose |
| --- | --- |
| `management` | Organizations, consolidated billing, account administration, and restricted access only. |
| `dev` | Development EKS/application resources and experimentation. |
| `production` | Production EKS/application resources and data. |

Add a `staging` account when release validation needs isolation, and a
`security-log-archive` account when implementing centralized security logging
and controls. This is a staged recommendation, not a requirement to create
every account before the project begins.

### Cost, Contacts, and Governance Baseline

- AWS allows a billing, operations, and security alternate contact; these can
  be distribution lists instead of named individuals. [AWS alternate contacts][aws-alternate-contacts]
- Budgets can alert specified email recipients, but cost data is delayed and
  alerts are not hard spending caps. [AWS Budgets best practices][aws-budgets]
- Billing access for identities must be explicitly activated and separately
  authorized. [AWS billing access][aws-billing-access]

**Recommended foundation controls:**

1. Root MFA with more than one recovery-capable MFA device, plus a documented
   organization-controlled recovery process that does not depend on one person.
2. Separate billing, security, and operations alternate contacts, ideally
   nonprofit-controlled distribution lists.
3. Monthly budgets with actual and forecast alerts to the leader and engineer.
   Set deliberately low early thresholds, then revise after an observed month
   of development usage.
4. Enable billing access only for approved finance/administration roles. Do not
   give all volunteers billing or payment-method visibility.
5. Require MFA for all human Identity Center users and perform a quarterly
   access review, including prompt volunteer offboarding.
6. Use Terraform/CI roles and temporary credentials; do not use root access
   keys or developer IAM-user access keys.

## Tradeoffs and Recommended Decision

| Option | Advantages | Risks | Recommendation |
| --- | --- | --- | --- |
| Single standalone account | Fastest initial setup. | Weak environment isolation; app workloads share the owner/billing account. | Do not use for this planned production app. |
| Organization with `dev` and `production` member accounts | Stronger blast-radius and cost separation; supports Terraform and volunteer roles. | Slightly more setup and account governance. | Recommended starting point. |
| Full multi-account landing zone immediately | Strong governance and security separation. | Overhead disproportionate to a small early nonprofit team. | Stage toward it as data sensitivity, team size, or spend justify it. |

**Recommended next decision:** Confirm organization eligibility and ownership
details, then perform a guided account-creation and identity-foundation
session before provisioning any application infrastructure.

## Open Questions and Blocking Decisions

1. Is the nonprofit U.S.-based, and what is its exact legal/tax-exempt
   classification? Is it already TechSoup-qualified?
2. Does the nonprofit have a domain, a controlled mailbox, and Google Workspace
   or Microsoft 365? This determines whether IAM Identity Center should start
   with its built-in directory or federate to an existing identity provider.
3. Is an organization-owned payment method available, and who besides the
   leader should receive billing notifications?
4. Will the app process personal, health, financial, child/minor, biometric, or
   other sensitive data? This changes security, privacy, retention, and
   incident-response requirements.
5. Who needs access in the next six months, and which roles truly require
   production write access?
6. What monthly spend is acceptable after promotional credits, and what alert
   thresholds and approval/escalation process should apply?
7. Is `dev` plus `production` sufficient initially, or is a separate staging
   environment required from the first release?
8. Which CI platform will run Terraform? The federation design differs by
   platform.
9. Which two nonprofit-controlled people will hold the documented break-glass
   recovery responsibilities if the engineer is unavailable?

## Assumptions

- The nonprofit is a distinct legal entity able to accept AWS terms and pay AWS
  invoices.
- The planned application can use separate development and production AWS
  accounts.
- The engineer is authorized to administer cloud infrastructure but is not the
  legal account owner.
- No claims are made here about eligibility or awarded credit amount; the
  applicable TechSoup/AWS application process is authoritative.

## Next Action

Obtain answers to the open questions, especially legal location/status,
organization-controlled identity and payment channels, data sensitivity, and
the CI platform. Then create a short implementation/operational brief defining
the account structure, roles, cost guardrails, and owner approval checkpoints.

## Information Needed From the Owner for Account Creation

Bring these items to the account-creation walkthrough. Do not send passwords,
MFA codes, card numbers, or sensitive identity documents to the engineer.

1. The nonprofit's exact legal name, physical address, main organization phone
   number, and the authorized representative who can accept the AWS Customer
   Agreement.
2. A dedicated, nonprofit-controlled root email inbox. It should be used only
   for AWS root-account notices and recovery, be accessible to the designated
   nonprofit owner, and have a documented continuity/recovery process.
3. An organization-owned payment method and billing address. AWS requires a
   valid payment method even if promotional credits will be requested later.
4. A phone that can receive AWS's one-time signup verification within minutes.
   Record whether that number belongs to the nonprofit and who can maintain it.
5. Two root MFA devices or recovery-capable authenticators, controlled by two
   designated nonprofit representatives. Do not make the engineer the sole
   root-MFA or root-email recovery holder.
6. Names and organization-controlled email addresses for the leader, engineer,
   billing contact, security contact, and operations contact. A distribution
   list is preferred for each alternate contact where the nonprofit can support
   it.
7. The initial monthly spend authority, early budget-alert thresholds, and the
   person authorized to approve additional spending.

## Information Needed From the Owner for Nonprofit Discount Registration

Collect these after account creation and before beginning the TechSoup/AWS
application. The owner or another nonprofit officer should control the
TechSoup organization account because it represents nonprofit eligibility and
accepts program terms.

1. Exact legal nonprofit name and U.S. EIN, if the organization is U.S.-based.
2. Tax-exempt designation and the organization registration or tax-exemption
   material TechSoup may request during qualification.
3. The organization's mission, primary activities, and annual operating
   budget. TechSoup uses organization information, including mission and legal
   status, in eligibility determinations.
4. The AWS account ID and confirmation that the AWS account's Account Name is
   the nonprofit's name.
5. A concise description of the intended AWS use. Include the mobile app,
   mission outcome, expected users/beneficiaries, and expected cloud services.
   Describe donor/member engagement or fundraising specifically if applying to
   AWS TechAction.
6. The nonprofit officer authorized to pay any applicable TechSoup
   administrative fee and accept program terms.

### Why Create the AWS Account Before Registering for Credits?

This is a dependency, not a decision to delay nonprofit eligibility work:

- TechSoup's AWS guidance requires a valid AWS account ID and an account name
  identifying the organization before credits can be applied.
- AWS account ownership, root recovery, MFA, payment method, Identity Center,
  billing contacts, and budgets should be established before technical
  provisioning starts, regardless of the eventual credit result.
- The nonprofit eligibility review and AWS account security are separate
  processes with different owners and evidence. Keeping them separate avoids
  mixing legal/financial approval with engineer access setup.

Start the TechSoup qualification process as soon as the AWS account is active;
do not defer it until after infrastructure build-out. Promotional credits,
amounts, eligible services, start dates, expiry, and whether they apply to
existing charges must be confirmed in the active offer terms before incurring
material usage.

## Step-by-Step: Set Up the Three Human Identities

There are three identities, but only two are everyday human users. The root
user is the nonprofit's emergency ownership identity; the leader and engineer
are separate IAM Identity Center workforce users.

### 1. Root User: Nonprofit Emergency Ownership Identity

1. The nonprofit leader, using the nonprofit-controlled root mailbox, creates
   the initial AWS account in the nonprofit's legal name and completes email,
   phone, and payment verification.
2. On the first root-console login, enable root MFA. Register two approved
   recovery-capable devices held by separate designated nonprofit
   representatives, following the nonprofit's documented recovery procedure.
3. Store the root password and recovery procedure in an organization-controlled
   password manager or approved secure process. Split responsibility for the
   password and MFA/recovery channels where practical, and do not record them
   in AWS resources within this same account.
4. Confirm there are no root access keys, then set a periodic review of the
   root email, phone, MFA devices, and recovery contacts.
5. Use this identity only for root-only administration and emergency recovery.
   The leader and engineer must not use it for daily console, CLI, Terraform,
   or GitHub Actions work.

### Immediate Walkthrough: Enable Root MFA After Signup

The signup screens can complete without asking you to register MFA. This is
normal. AWS requires root MFA, but registration may occur after the first
console sign-in; AWS currently requires it within 35 days of that first sign-in
if it was not configured already. Enable it now, before creating users,
Organizations, or infrastructure.

**Prepare before clicking through:**

- Use the nonprofit-controlled root email, not the engineer's email.
- Decide who holds the primary root MFA factor and who holds the independent
  backup. These must be designated nonprofit representatives, not solely the
  engineer.
- Preferred: have two FIDO-compatible hardware security keys available. AWS
  calls this option **Passkey or Security Key**. A passkey saved in an approved
  organization-controlled credential manager may also work, but a separate
  physical key provides clearer recovery separation.
- If keys are not available today, use a reputable authenticator application as
  a temporary primary factor, enable its secure backup/sync only if it is under
  nonprofit control, and register a second MFA factor as soon as possible.

**Register the first root MFA factor:**

1. Wait for AWS's account-activation email. Do not continue until the account
   is active.
2. Open the [AWS Management Console](https://console.aws.amazon.com/) in a
   private browser window. Select **Root user**, enter the nonprofit root email
   address, then enter the root password.
3. In the upper-right navigation bar, select the AWS account name or account
   number, then choose **Security credentials**. This opens **My security
   credentials** for the root user.
4. Find **Multi-factor authentication (MFA)**. It should show no MFA devices.
   Choose **Assign MFA device**.
5. Give the device a clear, non-secret name, such as
   `nonprofit-root-primary-key-2026`. Do not put the password, MFA code, or
   credential-manager recovery phrase in this name.
6. Choose **Passkey or Security Key** and select **Next**.
7. In the browser prompt, either insert and tap the FIDO security key, or
   choose the approved passkey provider/device. Complete the device PIN,
   fingerprint, face, or security-key interaction requested by the browser.
8. Select **Continue**. Confirm the device appears in the MFA device list.

**Register an independent backup factor immediately:**

1. Still on **My security credentials**, return to **Multi-factor
   authentication (MFA)** and choose **Assign MFA device** again.
2. Give it a distinct name, such as `nonprofit-root-backup-key-2026`.
3. Repeat the **Passkey or Security Key** flow using the second physical key or
   separately controlled approved passkey. Do not register the same key twice.
4. Confirm both devices appear. AWS permits up to eight root MFA devices; only
   one is needed at a time to sign in.
5. Store each physical key in a documented nonprofit-controlled location. Keep
   the two keys separately. Document the custodian, location, registration
   date, and recovery procedure, but never record the root password or MFA
   secrets in this document.

**Fallback: register a temporary authenticator application:**

1. At **Assign MFA device**, enter a device name and choose **Authenticator
   app**, then choose **Next**.
2. In the authenticator app on the approved device, add a new account and scan
   the QR code shown by AWS. Do not send the QR code, screenshot, or secret key
   through chat, email, or a ticket.
3. Enter the current six-digit code as **MFA code 1**. Wait for the app to show
   a new code, enter it as **MFA code 2**, and immediately choose **Add MFA**.
4. Register a second factor through the same Security credentials page as soon
   as practical. A phone-only TOTP setup without a second factor is a temporary
   risk, not the desired end state.

**Verify before moving on:**

1. Sign out of the root console.
2. Open a new private/incognito window and sign in again explicitly as **Root
   user** with the nonprofit root email and password.
3. Confirm AWS prompts for MFA. Use the primary factor to complete the login.
4. Sign out; repeat with the backup factor if it is available, then sign out.
5. Return to **Security credentials** and confirm that no root access keys
   exist. Do not create any.
6. Next, while in this verified root session, enable IAM Identity Center and
   create the leader's separate administrator identity. End root use after that
   administrator has been tested.

### 2. Leader: IAM Identity Center Owner and Billing User

The purpose of this procedure is to replace root use with an individual,
MFA-protected identity owned by the nonprofit leader. The leader must use an
organization-controlled email address they can personally access. Do not use
the root email as this user's email and do not create an IAM user.

**Before starting:** Root MFA must already be enabled and tested. Have the
leader's email inbox and MFA device available. The leader should be present for
the invitation, initial password, and MFA steps; do not set their password or
MFA on their behalf.

#### A. Create the AWS Organization

1. In a private browser window, sign in to the AWS Management Console as
   **Root user** with the nonprofit root email, root password, and an enrolled
   root MFA device.
2. Use the top search bar to open **AWS Organizations**. On the introductory
   page, choose **Create an organization**.
3. Choose the default **all features** organization. Do **not** select the
   consolidated-billing-only option. All features is needed for the normal
   multi-account governance model and is AWS's default/recommended choice.
4. Confirm the creation. The current nonprofit AWS account becomes the
   Organization's **management account** and remains responsible for the
   consolidated bill. It is not an application deployment account.
5. On the **AWS accounts** page, confirm that the nonprofit's initial account
   is displayed. If AWS sends an Organizations email-verification request to
   the root mailbox, complete it within the stated time. Save the displayed
   management account ID in the nonprofit's non-secret operational records.
6. Do not create `dev` or `production` yet unless you are continuing directly
   with the engineer-foundation procedure. First establish and test the
   leader's non-root administrator access.

#### B. Enable IAM Identity Center for the Organization

1. While still root only for this bootstrap action, use the console search bar
   to open **IAM Identity Center**.
2. On the setup page, choose **Enable**. Because this is the Organization
   management account, select or accept the **organization instance** option.
   Do not create an account instance; it is limited to one AWS account.
3. When prompted to choose an identity source, use the default **IAM Identity
   Center directory** unless the nonprofit already has a managed workforce
   identity provider, such as Google Workspace, Microsoft Entra ID, or Okta,
   that it is ready to integrate now.
4. Record the IAM Identity Center **AWS access portal URL** in the nonprofit's
   password manager or operations record. It is not a secret, but it is the
   normal sign-in address for the leader, engineer, and future volunteers.
5. Do not sign out yet. Continue to create the leader identity and its account
   assignment.

#### C. Create and Invite the Leader

1. In IAM Identity Center, select **Users** in the left navigation, then
   **Add user**.
2. Enter the leader's individual organization email address. Use a stable
   username such as `first.last`; the username cannot later be renamed.
3. Enter the leader's first name, last name, and display name. Review the email
   very carefully because AWS sends the invitation and password-setup link to
   it.
4. Select the default option to email password-setup instructions, then choose
   **Next** and **Add user**. Do not choose a one-time password that the leader
   cannot immediately receive and set themselves.
5. Create a group: select **Groups** -> **Create group** -> name it
   `Organization-Owners` -> **Create group**.
6. Return to **Users**, open the leader's user record, and add the leader to
   `Organization-Owners`.

#### D. Give the Leader Management-Account Administration

For this small organization, assign the leader an AWS-managed
`AdministratorAccess` permission set in the management account initially. This
does **not** make root use normal, and the management account must not host
application workloads. It ensures the nonprofit, rather than the engineer,
retains the ability to administer IAM Identity Center, Organizations, billing
access, and recovery operations. Narrow this later only after a tested set of
replacement permission sets exists.

1. In IAM Identity Center, select **AWS accounts**.
2. Select the nonprofit management account, then choose **Assign users or
   groups**.
3. Select **Groups**, check `Organization-Owners`, and choose **Next**.
4. Select the AWS-managed **AdministratorAccess** permission set. If it is not
   listed, choose **Create permission set**, select **Predefined permission
   set**, select **AdministratorAccess**, complete the prompts, then return to
   the account assignment flow.
5. Review the assignment: `Organization-Owners` -> nonprofit management
   account -> `AdministratorAccess`. Choose **Submit**.
6. Wait for the provisioning status to complete successfully. Do not assume it
   is usable until it shows success.

#### E. Have the Leader Activate and Test Their Own Access

1. Ask the leader to open the IAM Identity Center invitation email. They should
   verify it came from AWS and that its link leads to the expected AWS access
   portal, not a look-alike domain.
2. The leader sets their own password through the invitation flow. The engineer
   must not know or retain it.
3. The leader enrolls their own MFA method when the portal requires it. Prefer
   a passkey/security key; an authenticator app is acceptable when needed.
4. In a private browser window, the leader visits the recorded AWS access
   portal URL, signs in with their new Identity Center identity and MFA, selects
   the nonprofit management account, then selects the `AdministratorAccess`
   role.
5. Confirm that this opens the AWS Console without using root. In the top-right
   menu, confirm the session identifies the assumed role rather than **Root
   user**.
6. Ask the leader to sign out, repeat the access-portal sign-in once, and keep
   the invitation email only as a record after they have confirmed normal
   sign-in works.

#### F. Configure Billing Ownership and Alerts as the Leader

After the leader has proven their Identity Center admin access, have them sign
in through the access portal and perform these actions. Root should only be
used again if the console explicitly says a root-only action is required.

1. Open **Billing and Cost Management**. If the leader cannot open it, perform
   the root-only activation once: root signs in -> **Billing and Cost
   Management** -> **Account** -> **IAM user and role access to Billing
   information** -> **Edit** -> enable **Activate IAM access** -> **Update**.
   Then return to the leader's Identity Center session and retry.
2. In **Billing and Cost Management** -> **Account**, populate alternate
   **Billing**, **Security**, and **Operations** contacts with
   nonprofit-controlled addresses or distribution lists. Keep the primary root
   email separate and controlled by the nonprofit.
3. In **Billing and Cost Management** -> **Budgets**, create an initial monthly
   cost budget. Add actual-cost alerts at 50%, 80%, and 100% and a forecast
   alert at 100%. Send notifications to both the leader and engineer; agree the
   dollar amount with the nonprofit owner before saving it.
4. Confirm invoice and payment notifications go to the designated nonprofit
   billing contact. Do not grant these permissions broadly to volunteers.
5. Record the leader's access portal URL, group, management-account ID,
   alternate-contact addresses, budget threshold, and date of quarterly access
   review in the nonprofit's non-secret operations record.

#### G. End the Root Bootstrap Session

1. Confirm the leader can independently enter the access portal, complete MFA,
   access the management account, and open IAM Identity Center and Billing.
2. Confirm root MFA still shows two registered factors and root has no access
   keys.
3. Sign out of the root session and close the private browser window. From this
   point forward, use the leader's or engineer's separate IAM Identity Center
   identities for routine work.

### 3. Engineer: IAM Identity Center Engineering Administrator

1. Create an individual Identity Center user for the engineer with their own
   work email and MFA. Do not use the root email, a shared mailbox, or an IAM
   user for this purpose.
2. Create `Engineering-Administrators` and `Engineering-ReadOnly` groups.
   Initially assign the engineer administrator access only for the short
   foundation phase, then replace it with scoped account permissions and
   deployment-role access.
3. Create `dev` and `production` member accounts in the AWS Organization. Keep
   workloads and data out of the management account.
4. Assign the engineer's group the appropriate permission sets in `dev` and
   `production`; management-account organization and billing rights should be
   separate and limited.
5. Have the engineer sign into the IAM Identity Center access portal and
   configure CLI profiles with `aws configure sso`. Use `aws sso login --profile
   <profile>` for temporary Terraform and CLI credentials.
6. Verify the engineer can administer only the intended accounts, view required
   billing information, and cannot sign in as root. Remove temporary bootstrap
   administrator assignments once durable scoped roles are tested.

## Step-by-Step: Set Up Terraform and GitHub Actions Access

Do not create service IAM users with long-lived access keys for Terraform or
GitHub Actions. Use IAM roles and short-lived credentials instead.

### Terraform Used by the Engineer

1. In each workload account, create a dedicated deployment role, for example
   `TerraformDeploymentRole`. Give it only the permissions Terraform needs for
   the approved infrastructure scope; start broad only for bootstrap and reduce
   it after reviewing the Terraform plan and provider actions.
2. Trust the engineer's IAM Identity Center-derived role or a designated
   cross-account engineering role to assume the deployment role. Require MFA
   for the engineer's interactive Identity Center session.
3. Configure the engineer's Terraform AWS provider to use an IAM Identity
   Center CLI profile and assume the relevant deployment role. Do not put
   access keys in shell profiles, repository files, Terraform variables, or
   state.
4. Store Terraform state in an organization-controlled remote backend with
   encryption, restricted access, locking/concurrency protection, and separate
   state per environment. The backend design is a follow-on infrastructure
   decision and should be recorded before first apply.

### GitHub Actions CI/CD

1. In each AWS workload account, add GitHub's OIDC provider
   `https://token.actions.githubusercontent.com` to IAM.
2. Create a distinct role per deployment boundary, for example
   `GitHubActionsDevDeployRole` and `GitHubActionsProductionDeployRole`. Do not
   let one CI role administer every AWS account.
3. In each role trust policy, permit `sts:AssumeRoleWithWebIdentity` only from
   the GitHub OIDC provider and strictly constrain
   `token.actions.githubusercontent.com:sub` to the nonprofit's GitHub
   organization, repository, and intended branch or protected environment. Do
   not use an unrestricted wildcard.
4. Require the expected OIDC audience (`sts.amazonaws.com`) in the trust policy
   and use the smallest permissions policy that can perform the planned deploy.
   Separate plan/read roles from apply/deploy roles where the workflow supports
   that distinction.
5. In the GitHub Actions job that needs AWS, grant only `id-token: write` plus
   the minimum normal GitHub permissions. Configure the AWS credentials action
   to assume the matching role ARN; do not create AWS access-key GitHub secrets.
6. Use protected GitHub environments for production, restricting deployment
   branches/tags and requiring the nonprofit's designated approval where
   appropriate. Bind the production AWS role's OIDC trust condition to that
   protected environment or its approved release branch strategy.
7. Test a non-production plan first, review CloudTrail role-assumption events,
   then enable production deployment after the trust policy, GitHub environment
   rules, and least-privilege policy are reviewed.
8. Periodically review all Identity Center users, permission sets, Terraform
   roles, GitHub OIDC trust conditions, GitHub repository administrators, and
   workflow changes. Repository write access can become AWS deployment access.

AWS recommends OIDC federation for GitHub Actions and temporary credentials,
rather than long-term credentials outside AWS. AWS requires GitHub OIDC role
trust policies to constrain the `sub` claim; it recommends limiting it to
specific repositories and branches, and recommends protected environments when
they are used. GitHub requires `id-token: write` for a job to request its OIDC
token. [AWS OIDC federation][aws-oidc] [AWS GitHub OIDC role guidance][aws-github-oidc]
[GitHub OIDC reference][github-oidc]

[aws-signup]: https://docs.aws.amazon.com/accounts/latest/reference/getting-started.html
[aws-alternate-contacts]: https://docs.aws.amazon.com/accounts/latest/reference/manage-acct-update-contact-alternate.html
[aws-root]: https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-best-practices.html
[aws-nonprofit-credit]: https://aws.amazon.com/government-education/nonprofits/nonprofit-credit-program/
[techsoup-join]: https://support.techsoup.org/hc/en-us/articles/360055217213-How-do-I-join-TechSoup
[techsoup-aws-faq]: https://www.techsoup.org/support/articles-and-how-tos/aws-nonprofit-credit-program-faq
[aws-techaction]: https://aws.amazon.com/government-education/nonprofits/techaction/aws-techaction-faq/
[aws-account-setup]: https://docs.aws.amazon.com/IAM/latest/UserGuide/getting-started-account-iam.html
[identity-center-users]: https://docs.aws.amazon.com/singlesignon/latest/userguide/users-groups-provisioning.html
[aws-cli-sso]: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html
[org-management]: https://docs.aws.amazon.com/organizations/latest/userguide/orgs_best-practices_mgmt-acct.html
[consolidated-billing]: https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/consolidated-billing.html
[aws-budgets]: https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-best-practices.html
[aws-billing-access]: https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/control-access-billing.html
[aws-oidc]: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc.html
[aws-github-oidc]: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html
[github-oidc]: https://docs.github.com/en/actions/reference/security/oidc
