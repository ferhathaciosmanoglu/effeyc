/**
 * GlassButton — ikincil buton (cam pill). Hover'da turuncu kenar parlaması.
 * `href` verilirse <a>, aksi halde <button> olarak render edilir.
 */
import type React from "react";
import { cn } from "@/lib/utils";

type Common = { className?: string; children: React.ReactNode; active?: boolean };
type AsButton = Common & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AsLink = Common & React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function GlassButton(props: AsButton | AsLink) {
  const { className, children, active, ...rest } = props;
  const classes = cn(
    "glass-pill",
    active && "!bg-none !bg-fg border-fg text-[var(--bg)] hover:border-fg",
    className,
  );

  if (typeof rest.href === "string") {
    const anchorProps = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    const external = /^https?:\/\//.test(anchorProps.href ?? "");
    return (
      <a
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...anchorProps}
      >
        {children}
      </a>
    );
  }
  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
