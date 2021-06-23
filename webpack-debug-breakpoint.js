/*
    Creating Debug.breakpoint prototype
*/

// TODO: adicionar funções ao runtime logo após o 'use strict';
// TODO: melhorar performance identificando os patterns e usando slice & outros ao inves replace

const snippet_show_modal = `
    const Debug_breakpoint = (content, debuggerCallback) => {
        // if (true) { alert(_Debug_toString(content)); return content; }
        const overlay = document.createElement('div')
        overlay.style = \`
            position: absolute;
            top: 0px;
            left: 0px;
            width: 100%;
            height: 100%;
            border-radius: 5px;
            display: flex;
            justify-content: center;
            align-items: center;
        \`
        const modal = document.createElement('div');
        modal.style = \`
            z-index: 99999;
            padding: 32px;
            background-color: #DDD;
            box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
        \`
        modal.innerHTML = \`
        <div>
            <p>\$\{_Debug_toString(content)\}</p>
        </div>
        \`
        document.body.append(overlay)
        overlay.append(modal)
        debuggerCallback()
        document.body.removeChild(overlay)
        
        return content
    }
`


module.exports = source => step3(step2(step1(source)))

// Example: let _ = Debug.breakpoint {} in ...
const pattern_regex_with_variable = /var\s_v\d+\s=[^]{1,20}A2\([^]{0,20}\$elm\$core\$Debug\$log,[^]*?'Debug\.breakpoint',([^]*?)\);/g
const step1 = source => {
    let source_ = source
        .replace("'use strict';", `
            'use strict';
            ${snippet_show_modal}
        `)

    const matches = source.matchAll(pattern_regex_with_variable)
    for (const match of matches) {
        const found_pattern = match[0]
        const extracted_value = match[1]
        // const snippet = make_snippet(extracted_value)
        // console.log("==========")
        // console.log(found_pattern)
        // console.log("==========")
        // console.log(extracted_value)
        source_ = source_.replace(found_pattern, `Debug_breakpoint(${extracted_value}, () => { debugger; });`)
    }
    return source_
}

// Example: JD.string |> JD.map Debug.breakpoint
const pattern_str_pipe = "$elm$core$Debug$log('Debug.breakpoint')"
const step2 = source => {
    return source.replace(pattern_str_pipe,
        `(param => {
            const value = Debug_breakpoint (param, () => { debugger; });
            return value
        })`)
}

// Example: fnA |> fnB |> Debug.breakpoint |> fnC
const pattern_regex_pipe = /A2\([^]{0,20}\$elm\$core\$Debug\$log,[^]{0,20}'Debug\.breakpoint',/
const step3 = source => {
    let source_ = source
    while (true) {
        const match = source_.match(pattern_regex_pipe)
        if (match === null) break
        console.log(">>>>>>>>>>>", match.index)
        
        const found_pattern = match[0]
        console.log("=========A")
        console.log(found_pattern)
        console.log("=========B")

        let counter = 1 // A2 já começa abrindo (
        let buffer = ''
        let index = match.index + found_pattern.length
        while (true) {
            const c = source_[index]
            index++;
            if (c === '(') counter++;
            if (c === ')') counter--;
            if (counter === 0)
                break;
            buffer += c
        }
        console.log(buffer)
        const snippet =
            `(() => { const value = Debug_breakpoint ((${buffer}), () => { debugger; }); return value })()`
        const start = source_.slice(0, match.index)
        const end = source_.slice(index)
        source_ = start + snippet + end
        
    }
    return source_
}
