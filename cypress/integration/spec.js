function getOuterIframe() {
  // Based on https://www.cypress.io/blog/2020/02/12/working-with-iframes-in-cypress/
  return cy.get('iframe')
    .its('0.contentDocument')
    .its('body')
    .then(cy.wrap)
}

function getInnerIframe() {
  return getOuterIframe()
    .find('iframe')
    .its('0.contentDocument')
    .its('body')
    .then(cy.wrap)
}

function doAssertion() {
  // Wait for next frame to load
  cy.wait(3000)

  getInnerIframe()
    .should('contain', 'Engangskode')
}

describe("iframe within iframe", () => {
  beforeEach(() => {
    cy.server()
    cy.visit('https://www.bankid.no/privat/los-mitt-bankid-problem/test-din-bankid---multidokumentsignering/')

    // Wait for the frame to load
    cy.wait(3000)

    // Click first button
    getInnerIframe()
      .find('.document-list')
      .find('button')
      .first()
      .click()

    // Wait for next frame to load
    cy.wait(3000)

    // Check checkbox
    getInnerIframe()
      .contains('Innholdet er forstått og jeg er klar til å signere.')
      .click()

    // Click next button
    getInnerIframe()
      .find('button[title=Neste]')
      .click({ force: true }) // Need to force

    // Wait for next frame to load
    cy.wait(3000)
  })

  it("works when using force while typing and user executes keyboard action before submit", () => {
    // Type into input
    getInnerIframe()
      .find('input[type=tel]')
      .type('11111111111', { force: true })

    // Wait for user input (e.g. pressing an arrow key while having focus in the input field), then press the resume button
    cy.pause()

    // Submit form
    getInnerIframe()
      .find('form')
      .submit()

    doAssertion()
  })

  it("breaks when clicking label before typing", () => {
    // Type into input
    getInnerIframe()
      .contains('Fødselsnummer')
      .click()
      .type('11111111111')

    // Submit form
    getInnerIframe()
      .find('form')
      .submit()

    doAssertion()
  })

  it("breaks when using force while typing", () => {
    // Type into input
    getInnerIframe()
      .find('input[type=tel]')
      .type('11111111111', { force: true })

    // Submit form
    getInnerIframe()
      .find('form')
      .submit()

    doAssertion()
  })

  it("breaks when not using force while typing", () => {
    // Type into input
    getInnerIframe()
      .find('input[type=tel]')
      .type('11111111111')

    // Submit form
    getInnerIframe()
      .find('form')
      .submit()

    doAssertion()
  })
})