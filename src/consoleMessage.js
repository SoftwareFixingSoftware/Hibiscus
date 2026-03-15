export default function initConsoleMessage() {
  try {
    const titleStyle = 'font: 26px "Segoe UI", Roboto, sans-serif; font-weight:900; color:#d90429; padding:8px 12px;';
    const leadStyle  = 'font:15px/1.5 "Segoe UI", Roboto, monospace; font-weight:800; color:#c1121f; padding:6px 10px;';
    const infoStyle  = 'font:13px/1.5 monospace; color:#9d0208; padding:4px 10px;';
    const warnStyle  = 'font:13px/1.5 monospace; color:#780000; padding:4px 10px;';

    const ORG = 'Winnas EdTech KE';

    console.log('%c' + ORG, titleStyle);

    console.log('%cYou opened the developer console.', leadStyle);

    console.groupCollapsed('%cRead this first.', warnStyle);

    console.log(
      '%cWe know someone probably told you to open this console expecting something dramatic. It won’t happen.',
      infoStyle
    );

    console.log(
      '%cSearching for API keys, tokens, or secret endpoints here is a waste of time. Our platform is designed with that in mind.',
      infoStyle
    );

    console.log(
      '%cPasting random scripts from the internet into this console is how people compromise their own accounts. Think twice.',
      infoStyle
    );

    console.log(
      '%cIf you genuinely discovered a vulnerability, report it responsibly instead of trying to exploit it.',
      infoStyle
    );

    console.log(
      '%cShort version: Winnas EdTech KE is fully prepared for curious visitors like you.',
      leadStyle
    );

    console.log(
      '%cYou are welcome to look around — just understand that nothing interesting is hiding here.',
      warnStyle
    );

    console.groupEnd();

  } catch (e) {}
}