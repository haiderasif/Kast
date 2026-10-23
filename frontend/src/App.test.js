import { normalizeLink } from "./data";
test("maps a Firebase link record into a story card",()=>{const item=normalizeLink({id:"abc",title:"Example",domain:"example.com",userName:"Amaan Afaq",timestamp:1750489935405,likedByMe:true});expect(item.source).toBe("example.com");expect(item.initials).toBe("AA");expect(item.saved).toBe(true)});
