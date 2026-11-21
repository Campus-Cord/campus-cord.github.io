// ---------------------------------------------------------------- login name + password (so people never lose their account)
// Everyone starts with a Firebase "anonymous" account, which lives only in this browser. If the browser forgets it
// (school Chromebooks, clearing data, a new device), that account is gone. Adding a login name + password turns it into
// a normal account with the SAME user ID, so they can log back in anywhere and keep their name, Sparks and messages.
// Login names become fake emails (name@login.campuscord.app) because Firebase needs an email; nothing is ever emailed.
const LOGIN_DOMAIN = "@login.campuscord.app";
const loginSlug = n => String(n || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 30);
const loginEmail = n => loginSlug(n) + LOGIN_DOMAIN;
function hasPassword(){ const u = auth && auth.currentUser; return !!(u && !u.isAnonymous); }
function myLoginName(){ const u = auth && auth.currentUser; return u && u.email ? u.email.replace(LOGIN_DOMAIN, "") : ""; }
function loginErr(e){ const c = (e && e.code) || "";
  if (c.includes("email-already-in-use") || c.includes("credential-already-in-use")) return "That login name is taken. Try another one.";
  if (c.includes("weak-password")) return "The password needs at least 6 characters.";
  if (c.includes("operation-not-allowed")) return "Logging in isn't turned on yet. Massimo needs to turn on Email/Password in Firebase.";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found") || c.includes("invalid-login")) return "Wrong login name or password.";
  if (c.includes("too-many-requests")) return "Too many tries. Wait a few minutes and try again.";
  if (c.includes("network")) return "No internet connection.";
  return "Something went wrong (" + errMsg(e) + ")"; }

// Make a password for the account you're using now.
function setPasswordModal(){
  modal((m, close) => {
    const name = h("input",{class:"inp", maxlength:"30", autocomplete:"username", value: loginSlug(nickOf(S.uid))});
    const pw = h("input",{class:"inp", type:"password", autocomplete:"new-password", placeholder:"At least 6 characters"});
    const pw2 = h("input",{class:"inp", type:"password", autocomplete:"new-password", placeholder:"Type it again"});
    const err = h("div",{class:"err"});
    const go = h("button",{class:"btn", onclick:async () => { err.textContent = "";
      const s = loginSlug(name.value);
      if (s.length < 3){ err.textContent = "The login name needs at least 3 letters or numbers."; return; }
      if (pw.value.length < 6){ err.textContent = "The password needs at least 6 characters."; return; }
      if (pw.value !== pw2.value){ err.textContent = "The two passwords don't match."; return; }
      go.disabled = true; go.textContent = "Saving…";
      try{ await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(loginEmail(s), pw.value));
        prefs.pwNudge = Date.now(); savePrefs(); close();
        modal((m2, close2) => m2.append(h("h3",{text:"🔒 Your account is safe!"}),
          h("p",{class:"note",text:"If CampusCord ever asks you to join again, press \"Log in\" and use:"}),
          h("div",{class:"loginbox"}, h("div",null, "Login name: ", h("b",{text:s})), h("div",null, "Password: the one you just made")),
          h("p",{class:"note",text:"Take a picture or write it down. Nobody can reset it, not even Massimo."}),
          h("div",{class:"row",style:{justifyContent:"flex-end"}}, h("button",{class:"btn",onclick:close2},"Got it"))));
        need("me");
      }catch(e){ err.textContent = loginErr(e); go.disabled = false; go.textContent = "Save my password"; }
    }}, "Save my password");
    m.append(h("h3",{text:"🔒 Protect your account"}),
      h("p",{class:"note",text:"Right now your account only lives in this browser. If the browser forgets you, you'd have to start over with no Sparks or items. Make a login name and password so you can always log back in, on any device."}),
      h("label",{class:"f",text:"Login name"}), name,
      h("label",{class:"f",text:"Password"}), pw, pw2, err,
      h("div",{class:"row",style:{justifyContent:"flex-end",marginTop:"12px"}}, h("button",{class:"btn ghost",onclick:() => { prefs.pwNudge = Date.now(); savePrefs(); close(); }},"Later"), go));
    setTimeout(() => pw.focus(), 50);
  });
}

// Log back into an account that has a password (from the join screen).
function loginModal(){
  modal((m, close) => {
    const name = h("input",{class:"inp", maxlength:"30", autocomplete:"username", placeholder:"Your login name"});
    const pw = h("input",{class:"inp", type:"password", autocomplete:"current-password", placeholder:"Password"});
    const err = h("div",{class:"err"});
    const go = h("button",{class:"btn", onclick:async () => { err.textContent = "";
      if (!loginSlug(name.value) || !pw.value){ err.textContent = "Type your login name and password."; return; }
      go.disabled = true; go.textContent = "Logging in…";
      try{ await signInWithEmailAndPassword(auth, loginEmail(name.value), pw.value); location.reload(); }
      catch(e){ err.textContent = loginErr(e); go.disabled = false; go.textContent = "Log in"; }
    }}, "Log in");
    pw.onkeydown = e => { if (e.key === "Enter") go.click(); };
    m.append(h("h3",{text:"Log in"}), h("p",{class:"note",text:"Use the login name and password you made in Settings → My Account."}),
      h("label",{class:"f",text:"Login name"}), name, h("label",{class:"f",text:"Password"}), pw, err,
      h("p",{class:"note",text:"Never made a password? Ask Massimo to link your old account to your new one."}),
      h("div",{class:"row",style:{justifyContent:"flex-end",marginTop:"8px"}}, h("button",{class:"btn ghost",onclick:close},"Cancel"), go));
    setTimeout(() => name.focus(), 50);
  });
}

// The card in Settings → My Account.
function accountSafetyEl(){
  if (hasPassword()) return h("div",{class:"preview-card acctsafe ok"}, h("b",{text:"🔒 Your account is protected"}),
    h("div",{class:"note",style:{margin:"2px 0 0"}}, "Login name: ", h("b",{text:myLoginName()}), ". If CampusCord ever asks you to join again, press \"Log in\"."));
  return h("div",{class:"preview-card acctsafe"}, h("div",{style:{flex:"1"}}, h("b",{text:"⚠️ Your account isn't protected"}),
    h("div",{class:"note",style:{margin:"2px 0 0"},text:"If this browser forgets you, you lose your account. Make a password so you can always log back in."})),
    h("button",{class:"btn small", onclick:setPasswordModal}, "Make a password"));
}

// Ask once a week until they make one (owner: every day). Waits if another window is open.
function maybePasswordNudge(){
  if (hasPassword() || S.routed !== "app" || window.__ccNoPwNudge || window.__ccNoPop) return;
  const gap = isOwner() ? 864e5 : 7 * 864e5;
  if (prefs.pwNudge && Date.now() - prefs.pwNudge < gap) return;
  if ($("layer") && $("layer").children.length){ setTimeout(maybePasswordNudge, 30000); return; }
  prefs.pwNudge = Date.now(); savePrefs(); setPasswordModal();
}
