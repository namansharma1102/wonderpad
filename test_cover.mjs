async function test() {
  const title = "Mockingjay"
  const author = "Unknown Author"
  const query = encodeURIComponent(`${title} ${author !== 'Unknown Author' ? author : ''}`.trim())
  const url = `https://openlibrary.org/search.json?q=${query}&limit=1`
  console.log(url)
  const res = await fetch(url)
  const data = await res.json()
  const coverId = data?.docs?.[0]?.cover_i
  if (coverId) {
    console.log(`https://covers.openlibrary.org/b/id/${coverId}-L.jpg`)
  } else {
    console.log("No cover found")
  }
}
test()
test()
