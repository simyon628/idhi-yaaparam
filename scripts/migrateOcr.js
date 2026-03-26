const fs = require('fs');

// Copy idVerification
let idv = fs.readFileSync('c:\\Users\\SIMYON\\Downloads\\idVerification (1).ts', 'utf8');
fs.writeFileSync('d:\\idhi yaaparam\\lib\\idVerification.ts', idv);

// Read IdVerifyClient
let client = fs.readFileSync('c:\\Users\\SIMYON\\Downloads\\IdVerifyClient (1).tsx', 'utf8');

// Replace imports
client = client.replace('import { useAuth } from "@/contexts/AuthContext";', 'import { auth } from "@/lib/firebase";\nimport { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";');
client = client.replace('import { useRef, useState } from "react";', 'import { useRef, useState, useEffect } from "react";');

// Replace hook
client = client.replace('const { user } = useAuth();', `const [user, setUser] = useState<FirebaseUser | null>(null);\n  useEffect(() => {\n    if (auth) {\n      return onAuthStateChanged(auth as any, (u) => {\n        setUser(u as FirebaseUser);\n        if (u?.displayName) setEnteredName(u.displayName);\n      });\n    }\n  }, []);`);

fs.writeFileSync('d:\\idhi yaaparam\\app\\auth\\verify\\page.tsx', client);
