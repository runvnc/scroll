const tap = require("tap")
const { ScrollBuilder, ScrollCli, Article, MarkdownFile, SCROLL_SETTINGS_FILENAME } = require("./scroll.node.js")
const fs = require("fs")

const testString = "Build your own public domain newspaper"
const testPort = 5435

const runTree = testTree =>
	Object.keys(testTree).forEach(key => {
		testTree[key](tap.equal)
	})

const testTree = {}

testTree.builder = areEqual => {
	const builder = new ScrollBuilder()
	builder.verbose = false
	builder.startWatching(testPort)

	areEqual(!!builder.watcher, true)

	builder.stopWatchingForFileChanges()
}

testTree.scroll = areEqual => {
	areEqual(new ScrollBuilder().indexPage.includes(testString), true)
}

testTree.fullIntegrationTest = areEqual => {
	const builder = new ScrollBuilder()
	areEqual(!!builder, true)
}

testTree.import = async areEqual => {
	const cli = new ScrollCli()
	cli.verbose = false
	const result = await cli.importCommand()
	areEqual(result.includes("You need to add a"), true)
}

testTree.markdown = areEqual => {
	// Arrange
	const mdFile = `# hello world`
	// Act
	const scrollFile = new MarkdownFile(mdFile).toScroll()

	// Assert
	areEqual(mdFile, scrollFile)
}

testTree.article = areEqual => {
	const article = new Article(
		`title About me
hello world`
	)

	areEqual(
		article
			.toStumpNode()
			.toString()
			.includes("scrollArticleCell"),
		true
	)
}

testTree.cli = async areEqual => {
	const cli = new ScrollCli()
	cli.verbose = false
	// Act/Assert
	areEqual(cli.helpCommand().includes("help page"), true)

	// Act/Assert
	areEqual(cli.deleteCommand().includes("delete"), true)

	// Act/Assert
	const builder = await cli.buildCommand()
	areEqual(!!builder, true)

	// Act/Assert
	areEqual(cli.execute(["help"]).includes("help"), true)
}

testTree.errorStates = async areEqual => {
	const tempFolder = __dirname + "/tempFolderForTesting/"

	try {
		fs.mkdirSync(tempFolder)
		const cli = new ScrollCli()
		cli.verbose = false

		// Act/Assert
		const msg = await cli.buildCommand(tempFolder)
		areEqual(typeof msg, "string")

		// Act
		const result = await cli.initCommand(tempFolder)
		areEqual(fs.existsSync(tempFolder + SCROLL_SETTINGS_FILENAME), true)

		const builder = new ScrollBuilder(tempFolder).silence()
		const singleFile = builder.buildIndexPage()
		areEqual(singleFile.includes(testString), true)

		// Act
		const singlePages = builder.writeSinglePages()

		// Assert
		areEqual(singlePages.length, 1)

		// Assert
		const singlePageTitleSnippet = `Scroll</title>`
		areEqual(singlePages[0].html.includes(singlePageTitleSnippet), true)

		areEqual(builder.errors.flat().length, 0)
	} catch (err) {
		console.log(err)
	}
	fs.rmdirSync(tempFolder, { recursive: true })
}

// FS tests:
// scroll missing published folder
// scroll missing settings file
// settings file missing required settings
// bad Scroll files

if (module && !module.parent) runTree(testTree)

module.exports = { testTree }
