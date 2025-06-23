export function describe(name, fn) {
    console.log(`\n🔷 ${name}`);
    fn();
}

export function it(name, fn) {
    try {
        fn().then(() => console.log(`✅ ${name}`));
    } catch (e) {
        console.error(`❌ ${name}\n`, e);
    }
}