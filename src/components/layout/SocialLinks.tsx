/** SocialLinks — GitHub, LinkedIn, X bağlantıları (cam yuvarlak butonlar). URL'ler config/site.ts'de; boş olanlar gösterilmez. */
import { GithubIcon, LinkedinIcon, XIcon } from "@/components/ui/social-icons";
import { site } from "@/config/site";

const socialLinks = [
  { href: site.socials.github, label: "GitHub", Icon: GithubIcon },
  { href: site.socials.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
  { href: site.socials.x, label: "X (Twitter)", Icon: XIcon },
].filter((l) => l.href);

export function SocialLinks() {
  if (socialLinks.length === 0) return null;
  return (
    <ul className="flex items-center gap-2">
      {socialLinks.map(({ href, label, Icon }) => (
        <li key={label}>
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="glass-pill size-11 !px-0">
            <Icon className="size-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
