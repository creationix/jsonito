# Considering Base36

The original design was Base64 based and this works well for most use cases, especially embedding in JSON where we only need to avoid special chars and `"`.  But when considering embedding in urls using `encodeURIComponent` the original design becomes very bloated because of all the percent escapes needed.

## Consider which characters are available

First we must know which characters are avaialble to use and which are preferred for more use cases.

Only use characters that don't need escaping in either `JSON.stringify` or `escapeURIComponent`

- `0-9`
- `a-z`
- `A-Z`
- `-` `_` `(` `)` `~` `!` `*` `'` `.`

If more characters are needed, the following are not escaped by `escapeURI`, though I'm not sure what use case would care about this distinction, many of these have special meaning in URLs and can't be used for generic data storage.

- `@` `#` `$` `&` `+` `=` `:` `;` `,` `/` `?`

```js
> encodeURI("@#$&+=:;,/?")
'@#$&+=:;,/?'
> encodeURIComponent("@#$&+=:;,/?")
'%40%23%24%26%2B%3D%3A%3B%2C%2F%3F'
```

for embedding in a query string or fragment or path a subset of those is maybe safe:

- `@` (special meaning only in domain right?)
- `$` (not sure where has special meaning)
- `&` and `=` have special conventions in query string, but are allowed if we take over the entire query string
- `:` and `;` (not sure what special meaning)
- `/` is fine as long as we aren't trying to stay in a single path segment
- `?` is mostly safe inside query string or fragment
- `#` is never safe, not even inside a fragment
- `+` is mostly safe unless you're in the query string where it can be an escaped space

Therefore the mostly safe set is:

- `@`, `$`, `:`, `,`

And then if you don't care about embedding in a query string key/value add:

- `&`, `=`, `;`

If you don't care about embedding in a path segment

- `/` (which is likely in your data already anyway)

if you don't care about paths at all

- `?` would be mostly safe but if you start with it, some libs may trim it in query strings, also paths can't use it at all

So the final list of mostly safe chars in order are:

They are "mostly safe" because `escapeURIComponent` will escape them and is often used.

- `@`, `$`, `:`, `,`
- `/`
- `&`, `=`, `;`

## Assigning the characters

Now we need to consider how these sets of characters fit into the space we need.

Things we need to encode:

- b64 string tag
- normal string tag
- reference tag
- integer tag
- decimal tag (optionally different separator)
- true, false, null
- start object, end object
- start list, end list
- start scope, end scope

That's 14 different unique symbols at minimum

If we use base64, then `A-Z`, `-` and `_` are all taken by digits

But if we use base26, then those are available to tags.

Then we have plenty of symbols available technically

- `A-Z` (fully safe)
- `-` `_` `*` `.` (fully safe)
- `(` `)` `~` `!` `'` (escaped by `escape`)
- `@` `/` (escaped by `encodeUriComponent`, but not `escape`)
- `$` `:` `,` `&` `=` `;` (escaped by both `encodeURIComponent` and `escape`)

- b36_string - `_`
- reference tag - `*`
- integer tag - `.`
- string - `-`
- decimal tag - `~`
- true - `T`
- false - `F`
- null - `N`
- maps - `(` `)`
- lists - `'(` `)`
- scopes - `!(` `)`

But it's hard to assign them in ways that look nice unless we use two char opening tags for lists and scopes.

We can use `'` for list open and `!` for scope open, but it looks ugly because of unbalanced closing params.

An alternative to the pretty open/close delimeters is to go back to prefixed containers like in rando, but use count instead of byte length to preserve the insignificant whitespace rule.  Then we just need 3 type tags and avoid `(` and `)` which are escaped by `escape`.

- map - `M`
- list - `L`
- scope - `S`

Going back to the sample doc in JITO

```
(
  value:
  onclick:
  {
    menu: {
      id: file:
      & File:
      popup: {
        menuitem: [
          {
            & New:
            1& e$CreateNewDoc()
          }
          {
            & Open:
            1& 9$OpenDoc()
          }
          {
            & Close:
            1& a$CloseDoc()
          }
        ]
      }
    }
  }
)
```

It becomes:

```
3S
  value_
  onclick_
  1M
    menu_ 3M
      id_ file_
      * 4-File
      popup_ 1M
        menuitem_ 3L
          2M
            * 3-New
            1* e-CreateNewDoc()
          2M
            * 4-Open
            1* 9-OpenDoc()
          2M
            * 5-Close
            1* a-CloseDoc()
```

Compare the two with whitespace removed and the new form is slightly larger (mostly because we lost some b64_strings that can't encode as b36_strings)

```
(value:onclick:{menu:{id:file:&File:popup:{menuitem:[{&New:1&e$CreateNewDoc()}{&Open:1&9$OpenDoc()}{&Close:1&a$CloseDoc()}]}}})
3Svalue_onclick_1Mmenu_3Mid_file_*4-Filepopup_1Mmenuitem_3L2M*3-New1*e-CreateNewDoc()2M*4-Open1*9-OpenDoc()2M*5-Close1*a-CloseDoc()
```

When using `encodeURIComponent` the new form is significantly smaller as expected.

```
(value%3Aonclick%3A%7Bmenu%3A%7Bid%3Afile%3A%26File%3Apopup%3A%7Bmenuitem%3A%5B%7B%26New%3A1%26e%24CreateNewDoc()%7D%7B%26Open%3A1%269%24OpenDoc()%7D%7B%26Close%3A1%26a%24CloseDoc()%7D%5D%7D%7D%7D)
3Svalue_onclick_1Mmenu_3Mid_file_*4-Filepopup_1Mmenuitem_3L2M*3-New1*e-CreateNewDoc()2M*4-Open1*9-OpenDoc()2M*5-Close1*a-CloseDoc()
```

Similar when using `escape`

```
%28value%3Aonclick%3A%7Bmenu%3A%7Bid%3Afile%3A%26File%3Apopup%3A%7Bmenuitem%3A%5B%7B%26New%3A1%26e%24CreateNewDoc%28%29%7D%7B%26Open%3A1%269%24OpenDoc%28%29%7D%7B%26Close%3A1%26a%24CloseDoc%28%29%7D%5D%7D%7D%7D%29
3Svalue_onclick_1Mmenu_3Mid_file_*4-Filepopup_1Mmenuitem_3L2M*3-New1*e-CreateNewDoc%28%292M*4-Open1*9-OpenDoc%28%292M*5-Close1*a-CloseDoc%28%29
```

With `encodeURI` (which I doubt is actually relevent), the curly braces get escaped in the original and so it's smaller in even that contrived use case.

```
(value:onclick:%7Bmenu:%7Bid:file:&File:popup:%7Bmenuitem:%5B%7B&New:1&e$CreateNewDoc()%7D%7B&Open:1&9$OpenDoc()%7D%7B&Close:1&a$CloseDoc()%7D%5D%7D%7D%7D)
3Svalue_onclick_1Mmenu_3Mid_file_*4-Filepopup_1Mmenuitem_3L2M*3-New1*e-CreateNewDoc()2M*4-Open1*9-OpenDoc()2M*5-Close1*a-CloseDoc()
```

If we stop here, it's a hard decision between optimizing for url embedding and optimizing for json embedding.  Also the b36 variant looks nothing like JSON and so the JSONito name doesn't fit anymore.

## b64 trys harder

But I could optimize the original b64 version slightly by choosing different tags.

For example now that we removed pointers we can use `*` for reference instead of `&`

We can use `.` for b64 strings instead of `:`

We can use `~` for normal strings instead of `$`.

Also we can use `(` and `)` for maps since they are the most common container type and use `{` and `}` for scope

Then the original becomes:

```
{value.onclick.(menu.(id.file.*File.popup.(menuitem.[(*New.1*e~CreateNewDoc())(*Open.1*9~OpenDoc())(*Close.1*a~CloseDoc())])))}
```

which with `encodeURIComponent` double encoding is:

```
%7Bvalue.onclick.(menu.(id.file.*File.popup.(menuitem.%5B(*New.1*e~CreateNewDoc())(*Open.1*9~OpenDoc())(*Close.1*a~CloseDoc())%5D)))%7D
```

The original before tuning was a lot longer for context

```
(value%3Aonclick%3A%7Bmenu%3A%7Bid%3Afile%3A%26File%3Apopup%3A%7Bmenuitem%3A%5B%7B%26New%3A1%26e%24CreateNewDoc()%7D%7B%26Open%3A1%269%24OpenDoc()%7D%7B%26Close%3A1%26a%24CloseDoc()%7D%5D%7D%7D%7D)
```

But b36 is still slightly smaller

```
3Svalue_onclick_1Mmenu_3Mid_file_*4-Filepopup_1Mmenuitem_3L2M*3-New1*e-CreateNewDoc()2M*4-Open1*9-OpenDoc()2M*5-Close1*a-CloseDoc()
```

So far the unescaped b64 variant is just as effecient as before, but we made the double-escaped url version significantly smaller.  No tradeoffs yet.

But if we encode `List` and `Set` differently, that would help the url double encoded form more at the expense of the plain form.

What if we made scope not use parens at all, but a count.  It doesn't need to be nested and actually makes things really complicated if it can be

We could use `!` from the mostly safe character set and just a count of items (not including the final value) before it.

Then our original becomes:

```
2!value.onclick.(menu.(id.file.*File.popup.(menuitem.[(*New.1*e~CreateNewDoc())(*Open.1*9~OpenDoc())(*Close.1*a~CloseDoc())])))
```

But since this is not a random access format, we can go further.  What if each value in the scope could use every item before it?  Then we wouldn't need a delimeter at all, just push values on the stack and use the last value as the returned value. (this actually solves several minor issues I had with scope edge cases)

```
value.onclick.(menu.(id.file.*File.popup.(menuitem.[(*New.1*e~CreateNewDoc())(*Open.1*9~OpenDoc())(*Close.1*a~CloseDoc())])))
```

We're nearly there and still haven't compromised any.  In fact we shrunk the original version while solving unrelated problems!

double encoded is:

```
value.onclick.(menu.(id.file.*File.popup.(menuitem.%5B(*New.1*e~CreateNewDoc())(*Open.1*9~OpenDoc())(*Close.1*a~CloseDoc())%5D)))
```

The last escape is `[` and `]` in lists.  What if we revisit the `!` idea from before?

Then our original doesn't get larger for lists with less than under 64 values (and empty lists actually get smaller)

```
// Final optimized b64
value.onclick.(menu.(id.file.*File.popup.(menuitem.3!(*New.1*e~CreateNewDoc())(*Open.1*9~OpenDoc())(*Close.1*a~CloseDoc()))))

// The original b64
(value:onclick:{menu:{id:file:&File:popup:{menuitem:[{&New:1&e$CreateNewDoc()}{&Open:1&9$OpenDoc()}{&Close:1&a$CloseDoc()}]}}})
```

And finally when double encoded with `encodeURIComponent`:

```
// optimized b64 double encoded
value.onclick.(menu.(id.file.*File.popup.(menuitem.3!(*New.1*e~CreateNewDoc())(*Open.1*9~OpenDoc())(*Close.1*a~CloseDoc()))))

// original b64 double encoded
(value%3Aonclick%3A%7Bmenu%3A%7Bid%3Afile%3A%26File%3Apopup%3A%7Bmenuitem%3A%5B%7B%26New%3A1%26e%24CreateNewDoc()%7D%7B%26Open%3A1%269%24OpenDoc()%7D%7B%26Close%3A1%26a%24CloseDoc()%7D%5D%7D%7D%7D)
```

And finally, our final optimized b64 variant pretty printed with commentary (made possible by careful design to allow insignificant whitespace)

```jito
// This can be referenced later as `*`
value.

// This can be referenced later as `1*`
onclick.

// This object is the value returned when parsing
( menu. (
    id. file.
    * File.
    popup. (
      menuitem. 3!
        ( * New.
          1* e~CreateNewDoc() )
        ( * Open.
          1* 9~OpenDoc() )
        ( * Close.
          1* a~CloseDoc() )
    )
  )
)
```

pretty printer rules:

- 2 space indent
- if the `(` is the first token on the line, it's first k/v pair is allowed inline after it with one space
- if the `(` is the value in a k/v pair, it's allowed inline
- if `)` is not the first token and no other `)`'s exist on the line, it is allowed inline after one space
- always insert newline after `)`
- if all of a lists's children are primitives (non-containers)
  - they may flow inline like text with a single space between each, max width is 64 chars
  - the same line as the header may be used if everything (including the closing `)`) fits

Let's try another doc to test the pretty-printer rules:

```jito
4L
  ( color. red.
    fruits. 2L apple. strawberry. )
  ( color. green.
    fruits. 1L apple. )
  ( color. yellow.
    fruits. 2L apple. banana. )
  ( color. orange.
    fruits. 1L orange. )
```

And then with a scope: (treat references/pointers as primitives).

```jito
// Shared Values
color.  // *
fruits. // 1*
apple.  // 2*
orange. // 3*

// Root Value
4L
  ( * red.
    1* 2L 2* strawberry. )
  ( * green.
    1* 1L 2* )
  ( * yellow.
    1* 2L 2* banana. )
  ( * 3*
    1* 1L 3* )
```

- When all scope entries fit in a single line, add aligned comments for the refs that point to them
when they do not, insert a comment line above each.
- Add comments over shared values and root value

## Make is more JSON-like

While the prefix lists works well technically, I'm still unsure I like the design for asthetic purposes.  We call this JSONito after all.  Should it use `{`, `}`, `[`, and `]` like JSON?

Does this look better?

```jito
// Shared Values
color.  // *
fruits. // 1*
apple.  // 2*
orange. // 3*

// Root Value
[ { * red.
    1* [ 2* strawberry. ] }
  { * green.
    1* [ 2* ] }
  { * yellow.
    1* [ 2* banana. ] }
  { * 3*
    1* [ 3* ] }
]
```

I'm unsure what are the formatting rules for the small lists inside map entries, but overall this feel much more like a cousin of JSON instead of some other species.

maybe the rule for closing tokens is they are allowed inline if the current indent is no more than 1 level deeper than the opener

and for lists, the opening brace is always allowed inline if the `[` starts the line or the fist item doesn't fit on the line

The same formatting with the other sample doc is:

```jito
// Shared Values
value.    // *
onclick.  // 1*

// Root Value
{ menu. {
    id. file.
    * File.
    popup. {
      menuitem. [
        { * New.
          1* e~CreateNewDoc() }
        { * Open.
          1* 9~OpenDoc() }
        { * Close.
          1* a~CloseDoc() }
      ]
    }
  }
}
```

yeah, I think the formatting rule is inline first-line is allowed if:

- the opening token (`{` or `[`) is the first token on the line
- or the entire first line would fit inline within the 64 chars

## Url Safe?

Now going back to url safe encoding.  We can have a url safe variant that only tweaks the `{`, `}`, `[` and `]` chars and replace them with `(`, `)`, `(!`, and `)`.

```jito-url
// Shared Values
color.  // *
fruits. // 1*
apple.  // 2*
orange. // 3*

// Root Value
(!( * red.
    1* (! 2* strawberry. ) )
  ( * green.
    1* (! 2* ) )
  ( * yellow.
    1* (! 2* banana. ) )
  ( * 3*
    1* (! 3* ) )
)
```

Which isn't bad, but more lisp/scheme than JSON in flavor.

## Primitives Strike Again

OOPS, I forgot about `true`, `false`, and `null`.  I can't use `T`, `F`, and `N` in b64 mode, hmm...

Let's review.  First enumerate the symbols:

- `0-9` `a-z` `A-Z` `_` `-` - reserved for the base 64 digits and can't be used for any tags.
- `*` `.` - the most safe
- `(` `)` `~` `!` `'` - also safe *(only escaped by `escape`)*
- `@` `/` - semi safe *(escaped by `encodeUriComponent`, but not `escape`)*
- `$` `:` `,` `&` `=` `;` - semi safe *(escaped by both `encodeURIComponent` and `escape`)*
- `"` - not safe *(escaped by `JSON.stringify`)*

Now let's assign the symbols.  To avoid needing a seperate seperator and decimal token, we change decimal to be decimal first (containing the exponent) followed by normal integer encoding (containing the base).

- Reference - `*`
- Base64 String - `.`
- UTF8 String - `~`
- Map - `{` and `}` *(or `(` and `)` in URL-Safe mode)*
- List - `[` and `]` *(or `(!` and `)` in URL-Safe mode)*

Hmm, the only safe symbol we have lft is `'` and even that isn't perfectly safe since it prevents from embedding in single quote strings without escaping. But we have 6 tags left to assign.

Let's chose from the semi-safe set and not worry about URL-Safe for now...

- Integer - `'`
- Decimal - `:` and `'` *(not URL-Safe, but fairly rare)*
- True - `!`
- False - `F!`
- Null - `N!`
- External Dictionary - `@` *(not URL-Safe, but very rare)*

The decimal number `0.1` would encode as `DECIMAL(base=1,exp=-1)` which with zigzag encoding is `1:2'`. That kinda looks like a measurement so it's not too crazy.

We could technically use any of the remaining symbols for true/false/null, but I think they are rare enough that using the URL-Safe variant all the time would be preferred to save them for other uses where they make more sense.

We have other arbitrary syntax unrelated to a single compact value

- Line Comment - `//`
- Inline Comment `/*` and `*/`
- Multivalue seperator `;`

Then there are possible future types

- Bytes - `=`
- Tag Ref - `&` (not pointing into named dictionary or inline values)
- Fixed decimal (aka cents) - `$`

## Base64 Wins After all

So while we were considering Base36 to improve usage in URLs, we ended up just optimizing the Base64 system to work better with URls and fixed a major flaw in the scope system.

### Better symbol allocation

- Integer - `.`
- Decimal - `:` and `.`
- Base64 String - `'`
- UTF8 String - `~`
- True/False/Null - `!` `F!` `N!`

- Map - `{` and `}` *(or `(` and `)` in URL-Optimized mode)*
- List - `[` and `]` *(or `(!` and `)` in URL-Optimized mode)*

- Reference - `*`
- External Dictionary - `@`
- Multi-Value Delimeter `;`

- Line Comment - `//`
- Inline Comment - `/*` and `*/`

### New Scope Semantics

Scopes are implicit by encoding multiple values in series without a `;` delimeter.  Each value in the chain can reference any previous value by it's index.  When a `;` delimeter is encountered (or EOS), the final value is yielded and everything is reset.  This enables a socket to be a stream of values, each with their own inline shared values.

This also means we don't need to worry about nested scopes as it's no longer possible.

If a stream wishes to reuse shared subvalues among events/values in the stream, it can embed external dictionary IDs and then provide a way to request those via some side channel.

## Base36 is Faster

While optimizing the implementation we realized that parsing speeds could be greatly sped up by using base36 integers (especially in JavaScript that has native base36 support).  So despite base64 being technically better, base36 is used for maximum performance.
