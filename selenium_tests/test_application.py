
import getpass
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

BASE_URL = "http://studenthelpdesk.test/StudentHelpdesk/"

# Enter credentials locally; never store them in this script.
email = input("Admin email: ")
password = getpass.getpass("Admin password: ")

options = webdriver.ChromeOptions()
options.add_argument("--start-maximized")

driver = webdriver.Chrome(options=options)
wait = WebDriverWait(driver, 15)

try:
    print("\n1. Opening StudentHelpdesk...")
    driver.get(BASE_URL)
    print("Page title:", driver.title)
    print("Current URL:", driver.current_url)

    print("\n2. Checking page load...")
    wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
    print("PASS: Application page loaded")

    print("\n3. Inspecting login form...")
    print("Input fields found:", len(driver.find_elements(By.TAG_NAME, "input")))
    print("Buttons found:", len(driver.find_elements(By.TAG_NAME, "button")))

    print("\nInspect the login page before we automate login.")
    input("Press Enter after confirming the login form is visible...")

    # Login automation will be added after confirming the form selectors.
    print("\nPASS: Browser automation is working.")

except TimeoutException:
    print("FAIL: Timed out waiting for the page.")

except Exception as error:
    print("FAIL:", error)

finally:
    input("\nPress Enter to close the browser...")
    driver.quit()
