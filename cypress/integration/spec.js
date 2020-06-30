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

/*
 * These tests try to click through the iframes on the Norwegian BankID test page.
 * BankID is the most commonly used electronic identification system in Norway ( https://www.bankid.no/en/private/about-us/ ).
 *
 * The tests come to a stop when the form validator in the iframe doesn't run when using Cypress to type.
 *
 * Only the first test runs green as it involves the user executing a keyboard action which makes the validator run
 * which enables form submit.
 */
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
      /*
       * In order to click the "Next" button we need to use { force: true } or else an error would be thrown:
       * "Timed out retrying: Failed to execute 'getComputedStyle' on 'Window': parameter 1 is not of type 'Element'."
       * This is a different error than you get when an element is not present in the page, which would look like this
       * "Timed out retrying: Expected to find element: button[title=Neste], but never found it. Queried from element: <body>"
       */
      .click({ force: true })

    // Wait for next frame to load
    cy.wait(3000)
  })

  it("works when using force while typing and user executes keyboard action before submit", () => {
    // Type into input
    getInnerIframe()
      .find('input[type=tel]')
      .type('11111111111', { force: true })

    /*
     * Pause to allow for user keyboard input (e.g. pressing an arrow key while having focus in the input field).
     * When using { force: true } while typing, and then having the user execute a keyboard action in the input field
     * before submit, the validator runs and submit is enabled.
     */
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
      /*
       * Clicking the label to focus the input field allows for input without using force.
       * But the validator is not run so the submit stays disabled.
       */
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
      // When using { force: true } while typing, the validator doesn't run and submit stays disabled.
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
      /*
       * When using { force: false } while typing, nothing is typed into the input field and an error is thrown:
       * "Timed out retrying: Failed to execute 'getComputedStyle' on 'Window': parameter 1 is not of type 'Element'."
       * This is a different error than you get when an element is not present in the page, which would look like this
       * "Timed out retrying: Expected to find element: input[type=tl], but never found it. Queried from element: <body>"
       */
      .type('11111111111')

    // Submit form
    getInnerIframe()
      .find('form')
      .submit()

    doAssertion()
  })
})