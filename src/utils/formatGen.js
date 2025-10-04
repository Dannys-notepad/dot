module.exports = (gen) => {
    let strs = "⋆｡° ^@^C^A>^D^A^@^P^C^AL\n│\n";
    for (a in gen) {
        strs += "│  ⦿ " + gen[a] + "\n";
    }
    strs += "│\n└─ @ỹ@cmd delvin";
    return strs;
}