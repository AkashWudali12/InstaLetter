console.log("Script Injected");

// as soon as you enter the page, simulate scrolling and interaction 

// scroll without moving viewport and while chanding scroll position

function scrollPageToLoadContent() {
    return new Promise((resolve, reject) => {
        const scrollableElement = document.scrollingElement || document.documentElement;
        let totalHeight = 0;
        const distance = 100; // Number of pixels to scroll each step
        const delay = 1;    // Delay between each scroll (in milliseconds)

        const timer = setInterval(() => {
            // Modify scroll position without moving the viewport
            scrollableElement.scrollTop = totalHeight;
            totalHeight += distance;

            // Dispatch a scroll event to trigger lazy-loading
            const scrollEvent = new Event("scroll", { bubbles: true });
            window.dispatchEvent(scrollEvent);

            // Check if we've reached the bottom of the page
            if (totalHeight >= scrollableElement.scrollHeight - window.innerHeight) {
                scrollableElement.scrollTop -= totalHeight;
                clearInterval(timer);
                resolve();
            }
        }, delay);

        // Set a timeout to avoid infinite loops in case something goes wrong
        setTimeout(() => {
            scrollableElement.scrollTop -= totalHeight;
            clearInterval(timer);
            reject(new Error("Timeout reached while scrolling."));
        }, 10000); // Adjust timeout as needed
    });
}

const getIframeContent = () => {
    const iframes = document.querySelectorAll("iframe");
    let iframeHTML = "";

    iframes.forEach((iframe, index) => {
        try {
            // Attempt to access iframe content (same-origin only)
            const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            if (iframeDocument) {
                iframeHTML += `\n\n<iframe index="${index}">\n${iframeDocument.documentElement.outerHTML}\n</iframe>`;
            }
        } catch (error) {
            console.warn(`Could not access iframe at index ${index}:`, error);
            iframeHTML += `\n\n<iframe index="${index}">\nCross-origin content cannot be accessed.\n</iframe>`;
        }
    });

    return iframeHTML;
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GEN_COVER_LETTER") {
        try {
            // Use MutationObserver to wait for dynamic content to load

            scrollPageToLoadContent()
            .then(() => {
                console.log("Scrolling complete. All content should now be loaded.");
                const fullHTML = document.documentElement.outerHTML;
                console.log(fullHTML);
            })
            .catch((err) => {
                console.error(err);
            });

            const observer = new MutationObserver((mutations, obs) => {
                const allContentReady = document.readyState === "complete";
                if (allContentReady) {
                    console.log("All dynamic content loaded.");

                    // Stop observing once content is fully loaded
                    obs.disconnect();

                    // Extract the full HTML including dynamically loaded content
                    const body = document.documentElement.outerHTML;

                    // Append iframe content to the body HTML
                    const iframeContent = getIframeContent();
                    const fullContent = body + iframeContent;

                    // Create the prompt with the combined HTML
                    const prompt = `Below is the HTML body of a job application page, including iframe content if available. Extract all the job information from the HTML below. 
                    If there is no job information or if you could not get it, then output "no job info" \n\n${fullContent}`;

                    console.log("Prompt from content (including iframes):");
                    console.log(prompt);

                    sendResponse({
                        status: "success",
                        prompt: prompt
                    });
                }
            });

            // Observe the entire document for changes
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true
            });

            // Add a timeout to avoid indefinite waiting
            setTimeout(() => {
                observer.disconnect();
                console.log("Timeout reached: Dynamic content might not be fully loaded.");
                const body = document.documentElement.outerHTML;
                const iframeContent = getIframeContent();
                const fullContent = body + iframeContent;

                const prompt = `Below is the HTML body of a job application page, including iframe content if available. Extract all the job information from the HTML below. 
                If there is no job information or if you could not get it, then output "no job info" \n\n${fullContent}`;

                console.log("Prompt from content (including iframes):");
                console.log(prompt);

                sendResponse({
                    status: "success",
                    prompt: prompt
                });
            }, 5000); // Adjust timeout as needed
        } catch (err) {
            sendResponse({
                status: "failure",
                error: err.message
            });
        }

        return true; // Keep the message channel open for asynchronous response
    }
});
